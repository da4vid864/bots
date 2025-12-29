/**
 * EJEMPLOS DE USO - BotInteligente 2.0
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar
 * los nuevos servicios implementados en Fase 1
 */

// =====================================================
// 1. ANALYTICS SERVICE
// =====================================================

/**
 * Registrar evento personalizado
 */
async function example_logAnalyticsEvent() {
  const analyticsService = require('./services/analyticsService');
  
  // Registrar evento
  const result = await analyticsService.logEvent(
    'tenant-uuid-123',
    'custom_conversion',
    {
      leadId: 'lead-456',
      productId: 'prod-789',
      amount: 99.99,
      currency: 'MXN'
    }
  );
  
  console.log(result);
  // Retorna: { success: true, timestamp: Date }
}

/**
 * Obtener dashboard completo
 */
async function example_getAnalyticsDashboard() {
  const analyticsService = require('./services/analyticsService');
  
  const startDate = new Date(Date.now() - 30 * 24 * 3600000); // 30 días atrás
  const endDate = new Date();
  
  const metrics = await analyticsService.getMetricsReport(
    'tenant-uuid-123',
    startDate,
    endDate
  );
  
  console.log(metrics);
  // Retorna array de eventos agrupados por tipo
}

/**
 * Verificar salud del sistema
 */
async function example_getSystemHealth() {
  const analyticsService = require('./services/analyticsService');
  
  const health = await analyticsService.getSystemHealth('tenant-uuid-123');
  
  console.log(health);
  // Retorna:
  // {
  //   uptime: 12345678,
  //   timestamp: Date,
  //   channels: {
  //     whatsapp: { messages: 150, errors: 2, error_rate: '1.33%' },
  //     web: { messages: 45, errors: 0, error_rate: '0%' }
  //   },
  //   services: {
  //     database: { status: 'healthy', lastCheck: Date },
  //     deepseek: { status: 'healthy', lastCheck: Date },
  //     storage: { status: 'healthy', lastCheck: Date }
  //   }
  // }
}

/**
 * Trackear llamada a IA
 */
async function example_trackAIRequest() {
  const analyticsService = require('./services/analyticsService');
  
  const startTime = Date.now();
  
  // ... Llamar a DeepSeek
  const response = await deepseekService.getChatReply('Hola', [], 'prompt');
  
  const duration = Date.now() - startTime;
  
  await analyticsService.trackAIRequest(
    'tenant-uuid-123',
    'lead-uuid-456',
    'deepseek-chat',
    120,      // prompt tokens
    45,       // completion tokens
    duration  // ms
  );
}

// =====================================================
// 2. PREDICTIVE ENGINE SERVICE
// =====================================================

/**
 * Calcular score predictivo avanzado
 */
async function example_calculateAdvancedScore() {
  const predictiveEngine = require('./services/predictiveEngineService');
  
  const score = await predictiveEngine.calculateAdvancedLeadScore(
    'tenant-uuid-123',
    'lead-uuid-456'
  );
  
  console.log(score);
  // Retorna:
  // {
  //   score: 75,
  //   components: {
  //     base: 60,
  //     response: 20,
  //     temporal: 15,
  //     intention: 18,
  //     churnRisk: -8
  //   },
  //   churnRisk: { riskScore: 25, level: 'low', ... },
  //   recommendation: 'Enviar información de producto y precios',
  //   calculatedAt: Date
  // }
}

/**
 * Analizar intención de mensaje
 */
async function example_analyzeMessageIntention() {
  const predictiveEngine = require('./services/predictiveEngineService');
  
  const intention = await predictiveEngine.analyzeMessageIntention(
    'tenant-uuid-123',
    'Quiero comprar 2 productos ahora, ¿cuál es el precio?',
    'lead-uuid-456'
  );
  
  console.log(intention);
  // Retorna:
  // {
  //   score: 85,
  //   level: 'high',
  //   keywordsMatched: ['comprar', 'precio'],
  //   recommendation: 'Iniciar proceso de cierre inmediatamente'
  // }
}

/**
 * Detectar riesgo de churn
 */
async function example_predictChurnRisk() {
  const predictiveEngine = require('./services/predictiveEngineService');
  
  // Usar método privado (en producción crear método público)
  const churnRisk = await predictiveEngine._predictChurnRisk(
    'tenant-uuid-123',
    'lead-uuid-456'
  );
  
  console.log(churnRisk);
  // Retorna:
  // {
  //   riskScore: 65,
  //   level: 'medium',
  //   daysSinceLastMessage: 8,
  //   reasons: ['Sin interacción por 7-14 días'],
  //   suggestedAction: 'Enviar contenido relevante o encuesta'
  // }
}

// =====================================================
// 3. EMAIL AUTOMATION SERVICE
// =====================================================

/**
 * Enviar email simple
 */
async function example_sendEmail() {
  const emailService = require('./services/emailAutomationService');
  
  const result = await emailService.sendEmail(
    'tenant-uuid-123',
    'user@example.com',
    'Bienvenida a BotInteligente',
    '<h1>¡Hola!</h1><p>Gracias por registrarte</p>',
    'lead-uuid-456'
  );
  
  console.log(result);
  // Retorna: { success: true, emailId: 'uuid', externalId: 'sendgrid-id' }
}

/**
 * Crear secuencia de email automática
 */
async function example_createEmailSequence() {
  const emailService = require('./services/emailAutomationService');
  
  const sequence = await emailService.createEmailSequence(
    'tenant-uuid-123',
    'Secuencia de Bienvenida',
    [
      {
        delayHours: 0,
        subject: 'Bienvenida a nuestro programa',
        htmlContent: `
          <h1>¡Hola y bienvenido!</h1>
          <p>Nos alegra que te unas a nuestra comunidad</p>
          <a href="https://botinteligente.com">Ver más</a>
        `
      },
      {
        delayHours: 24,
        subject: 'Conoce nuestros productos',
        htmlContent: `
          <h1>Catálogo de Productos</h1>
          <p>Revisa nuestras ofertas especiales</p>
        `
      },
      {
        delayHours: 72,
        subject: 'Oferta exclusiva solo para ti',
        htmlContent: `
          <h1>20% de descuento</h1>
          <p>Válido solo por 24 horas</p>
        `
      }
    ]
  );
  
  console.log(sequence);
  // Retorna: { success: true, sequenceId: 'uuid' }
}

/**
 * Asignar lead a secuencia
 */
async function example_assignLeadToSequence() {
  const emailService = require('./services/emailAutomationService');
  
  const assignment = await emailService.assignLeadToSequence(
    'tenant-uuid-123',
    'lead-uuid-456',
    'sequence-uuid-789'
  );
  
  console.log(assignment);
  // Retorna: { success: true, assignmentId: 'uuid' }
  // El primer email se envía inmediatamente
  // Los siguientes se programan automáticamente
}

/**
 * Procesar emails programados (ejecutar cada minuto)
 */
async function example_processScheduledEmails() {
  const emailService = require('./services/emailAutomationService');
  
  // Esto debería ejecutarse en un cron job cada minuto
  setInterval(async () => {
    await emailService.processScheduledEmails();
  }, 60000);
  
  // O manualmente:
  await emailService.processScheduledEmails();
  // Envía todos los emails cuyo scheduled_time <= NOW()
}

/**
 * Obtener estadísticas de secuencia
 */
async function example_getSequenceStats() {
  const emailService = require('./services/emailAutomationService');
  
  const stats = await emailService.getSequenceStats(
    'tenant-uuid-123',
    'sequence-uuid-789'
  );
  
  console.log(stats);
  // Retorna:
  // {
  //   totalSent: 150,
  //   opened: 45,
  //   clicked: 18,
  //   failed: 2,
  //   openRate: '30.00%',
  //   clickRate: '12.00%'
  // }
}

// =====================================================
// 4. COMPLIANCE ALERTS SERVICE
// =====================================================

/**
 * Obtener estado de compliance general
 */
async function example_getComplianceStatus() {
  const complianceService = require('./services/complianceAlertsService');
  
  const status = await complianceService.getComplianceStatus('tenant-uuid-123');
  
  console.log(status);
  // Retorna:
  // {
  //   overallScore: 85,
  //   status: 'compliant',
  //   timestamp: Date,
  //   findings: {
  //     missedConsents: { found: false, count: 0 },
  //     piiDetected: { found: true, count: 3, samples: [...] },
  //     arcoStatus: { found: false, urgentCount: 0 },
  //     suspiciousAccess: { found: false }
  //   }
  // }
}

/**
 * Verificar consentimientos faltantes
 */
async function example_checkMissingConsents() {
  const complianceService = require('./services/complianceAlertsService');
  
  const result = await complianceService.checkMissingConsents('tenant-uuid-123');
  
  console.log(result);
  // Si hay consentimientos faltantes:
  // {
  //   found: true,
  //   count: 5,
  //   leads: [
  //     { id: 'uuid', email: 'user@example.com', name: 'John', created_at: Date }
  //   ]
  // }
}

/**
 * Escanear por datos personales sensibles
 */
async function example_scanForPII() {
  const complianceService = require('./services/complianceAlertsService');
  
  const result = await complianceService.scanForPII('tenant-uuid-123');
  
  console.log(result);
  // Detecta patrones de:
  // - Tarjetas de crédito
  // - Social Security Numbers
  // - Teléfonos
  // - Pasaportes
  // - RFC (México)
  // - CPF (Brasil)
}

/**
 * Verificar solicitudes ARCO próximas a vencer
 */
async function example_checkARCORequests() {
  const complianceService = require('./services/complianceAlertsService');
  
  const result = await complianceService.checkARCORequests('tenant-uuid-123');
  
  console.log(result);
  // Retorna solicitudes que vencen en <5 días
}

/**
 * Generar reporte para auditoría
 */
async function example_generateComplianceReport() {
  const complianceService = require('./services/complianceAlertsService');
  
  const startDate = new Date('2025-12-01');
  const endDate = new Date('2025-12-31');
  
  const report = await complianceService.generateComplianceReport(
    'tenant-uuid-123',
    startDate,
    endDate
  );
  
  console.log(report);
  // Retorna reporte completo con:
  // - Alertas por período
  // - Solicitudes ARCO procesadas
  // - Consentimientos registrados
  // - Auditoría de accesos
}

/**
 * Iniciar monitoreo automático
 */
async function example_startComplianceMonitoring() {
  const complianceService = require('./services/complianceAlertsService');
  
  const result = await complianceService.startComplianceMonitoring('tenant-uuid-123');
  
  console.log(result);
  // Retorna: { success: true, message: 'Monitoreo iniciado' }
  // Se ejecutan verificaciones cada 6 horas automáticamente
}

// =====================================================
// 5. WEB CHAT WIDGET (en Frontend)
// =====================================================

/**
 * Implementar widget en sitio
 */
function example_implementWebWidget() {
  // 1. En React:
  import WebChatWidget from './components/WebChatWidget';
  
  export default function MyPage() {
    return (
      <div>
        <h1>Bienvenido</h1>
        {/* Widget aparecerá en esquina inferior derecha */}
        <WebChatWidget 
          tenantId="tenant-uuid-123"
          botName="Soporte BotInteligente"
        />
      </div>
    );
  }
  
  // 2. O como script externo (para otros sitios):
  // <script src="https://botinteligente.com/widget.js"></script>
  // <script>
  //   BotInteligente.init({ tenantId: 'tenant-uuid-123', botName: 'Chat' });
  // </script>
}

// =====================================================
// 6. INTEGRACIONES CON RUTAS API
// =====================================================

/**
 * Llamar a endpoints desde cliente
 */
async function example_apiEndpoints() {
  const tenantId = 'tenant-uuid-123';
  
  // Dashboard de analytics
  const dashboard = await fetch('/api/analytics/dashboard', {
    headers: { 'X-Tenant-ID': tenantId }
  }).then(r => r.json());
  
  // Salud del sistema
  const health = await fetch('/api/analytics/health', {
    headers: { 'X-Tenant-ID': tenantId }
  }).then(r => r.json());
  
  // Status de compliance
  const compliance = await fetch('/api/compliance/status', {
    headers: { 'X-Tenant-ID': tenantId }
  }).then(r => r.json());
  
  // Alertas de compliance
  const alerts = await fetch('/api/compliance/alerts?limit=20', {
    headers: { 'X-Tenant-ID': tenantId }
  }).then(r => r.json());
  
  // Iniciar monitoreo
  const monitoring = await fetch('/api/compliance/start-monitoring', {
    method: 'POST',
    headers: { 'X-Tenant-ID': tenantId }
  }).then(r => r.json());
}

// =====================================================
// 7. INTEGRACIÓN EN SERVIDOR EXPRESS
// =====================================================

/**
 * Integrar servicios en rutas existentes
 */
function example_integrationInRoutes() {
  const express = require('express');
  const router = express.Router();
  const analyticsService = require('../services/analyticsService');
  const predictiveEngine = require('../services/predictiveEngineService');
  
  // Ruta para procesar mensaje de WhatsApp
  router.post('/whatsapp/message', async (req, res) => {
    const { tenantId, leadId, message } = req.body;
    
    // 1. Guardar mensaje
    // ...
    
    // 2. Trackear en analytics
    await analyticsService.trackChannelEvent(
      tenantId,
      'whatsapp',
      'message_received',
      { leadId, messageLength: message.length }
    );
    
    // 3. Analizar intención
    const intention = await predictiveEngine.analyzeMessageIntention(
      tenantId,
      message,
      leadId
    );
    
    // 4. Recalcular score
    const score = await predictiveEngine.calculateAdvancedLeadScore(
      tenantId,
      leadId
    );
    
    // 5. Actualizar lead
    // ...
    
    res.json({ success: true, intention, score });
  });
}

module.exports = {
  example_logAnalyticsEvent,
  example_getAnalyticsDashboard,
  example_calculateAdvancedScore,
  example_sendEmail,
  example_createEmailSequence,
  example_getComplianceStatus,
  example_apiEndpoints
};
