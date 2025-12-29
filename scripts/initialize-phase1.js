/**
 * scripts/initialize-phase1.js
 * Script para inicializar fase 1 de BotInteligente 2.0
 * Ejecutar con: node scripts/initialize-phase1.js
 */

const pool = require('../services/db');
require('dotenv').config();

async function initializePhase1() {
  console.log('🚀 Inicializando BotInteligente 2.0 - Fase 1...\n');

  try {
    // 1. Crear tablas necesarias
    console.log('📋 Creando tablas...');
    await createTables();
    console.log('✅ Tablas creadas\n');

    // 2. Crear índices para performance
    console.log('🏃 Creando índices...');
    await createIndexes();
    console.log('✅ Índices creados\n');

    // 3. Configurar políticas RLS si es necesario
    console.log('🔒 Verificando RLS...');
    await setupRLS();
    console.log('✅ RLS configurado\n');

    // 4. Verificar integridad
    console.log('🔍 Verificando integridad...');
    await verifyIntegrity();
    console.log('✅ Integridad verificada\n');

    console.log('🎉 ¡Fase 1 inicializada correctamente!');
    console.log('\nPróximos pasos:');
    console.log('1. npm start          - Iniciar servidor');
    console.log('2. npm run client     - Iniciar cliente React');
    console.log('3. Visitar http://localhost:3000');
    console.log('\nNuevas rutas disponibles:');
    console.log('- POST   /api/web-chat/init');
    console.log('- POST   /api/web-chat/message');
    console.log('- GET    /api/analytics/dashboard');
    console.log('- GET    /api/compliance/status');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante inicialización:', error.message);
    process.exit(1);
  }
}

async function createTables() {
  const createTableQueries = `
    -- Analytics Events
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      event_type VARCHAR(100),
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Web Chat Sessions
    CREATE TABLE IF NOT EXISTS web_chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      metadata JSONB DEFAULT '{}'
    );

    -- Email History
    CREATE TABLE IF NOT EXISTS email_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
      recipient_email VARCHAR(255),
      subject TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      external_id VARCHAR(255),
      error_message TEXT,
      sent_at TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Email Sequences
    CREATE TABLE IF NOT EXISTS email_sequences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255),
      steps JSONB,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Email Sequence Assignments
    CREATE TABLE IF NOT EXISTS email_sequence_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'active',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );

    -- Email Schedule
    CREATE TABLE IF NOT EXISTS email_schedule (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      assignment_id UUID REFERENCES email_sequence_assignments(id) ON DELETE CASCADE,
      sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
      step_index INTEGER,
      scheduled_time TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      sent_at TIMESTAMP
    );

    -- Compliance Alerts
    CREATE TABLE IF NOT EXISTS compliance_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      level VARCHAR(50),
      type VARCHAR(100),
      message TEXT,
      metadata JSONB DEFAULT '{}',
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Lead Score History
    CREATE TABLE IF NOT EXISTS lead_score_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      old_score DECIMAL(5,2),
      new_score DECIMAL(5,2),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Extensiones a leads
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS contains_pii BOOLEAN DEFAULT FALSE;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS predictive_score DECIMAL(5,2);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_index INTEGER;

    -- Extensiones a lead_messages
    ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS contains_pii BOOLEAN DEFAULT FALSE;
  `;

  // Split y ejecutar cada statement por separado
  const statements = createTableQueries
    .split(';')
    .filter(stmt => stmt.trim().length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (error) {
      // Ignorar errores de "ya existe"
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)',
    'CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_email_tenant ON email_history(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_email_status ON email_history(status)',
    'CREATE INDEX IF NOT EXISTS idx_sequences_tenant ON email_sequences(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_schedule_tenant ON email_schedule(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_schedule_time ON email_schedule(scheduled_time)',
    'CREATE INDEX IF NOT EXISTS idx_compliance_tenant ON compliance_alerts(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_compliance_level ON compliance_alerts(level)',
    'CREATE INDEX IF NOT EXISTS idx_score_history_tenant ON lead_score_history(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_score_history_lead ON lead_score_history(lead_id)'
  ];

  for (const index of indexes) {
    try {
      await pool.query(index);
    } catch (error) {
      // Ignorar errores de "ya existe"
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }
}

async function setupRLS() {
  // Si usan RLS, aplicarla a las nuevas tablas
  const rlsStatements = [
    'ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE web_chat_sessions ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE email_history ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE email_schedule ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY'
  ];

  for (const stmt of rlsStatements) {
    try {
      await pool.query(stmt);
    } catch (error) {
      // Ignorar errores si RLS ya está habilitado
      if (!error.message.includes('already enabled')) {
        console.warn(`⚠️ RLS warning: ${error.message}`);
      }
    }
  }
}

async function verifyIntegrity() {
  const tables = [
    'analytics_events',
    'web_chat_sessions',
    'email_history',
    'email_sequences',
    'compliance_alerts'
  ];

  for (const table of tables) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
      [table]
    );
    if (result.rows[0].count === 0) {
      throw new Error(`Tabla ${table} no existe`);
    }
  }
}

// Ejecutar si es script principal
if (require.main === module) {
  initializePhase1();
}

module.exports = { initializePhase1 };
