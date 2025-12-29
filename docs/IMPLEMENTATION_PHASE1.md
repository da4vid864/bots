# 🚀 Plan de Implementación - BotInteligente 2.0

**Fecha:** 29 de Diciembre 2025  
**Estado:** ✅ Fase 1 - Implementación Inicial Completada

---

## 📋 Resumen de Cambios Implementados

### Módulos de Servicios Creados

#### 1. **analyticsService.js** ✅
Sistema centralizado de métricas y tracking en tiempo real.

**Características:**
- Logging de eventos por canal (WhatsApp, Email, Web, IA)
- Dashboard de salud del sistema
- Tracking específico para llamadas IA
- Análisis de tendencias por período
- Métricas de leads y compliance

**Ubicación:** `/services/analyticsService.js`

**Uso básico:**
```javascript
const analytics = require('./services/analyticsService');

// Registrar evento
await analytics.logEvent(tenantId, 'whatsapp_sent', {
  leadId: '123',
  messageContent: 'Hola',
  duration_ms: 1200
});

// Obtener métricas
const metrics = await analytics.getMetricsReport(tenantId, startDate, endDate);

// Obtener salud del sistema
const health = await analytics.getSystemHealth(tenantId);
```

---

#### 2. **predictiveEngineService.js** ✅
Motor de análisis predictivo para scoring avanzado de leads.

**Características:**
- Scoring avanzado multicomponente (base, respuesta, temporal, intención, churn)
- Análisis de intención de mensajes con keywords LATAM
- Detección predictiva de riesgo de churn
- Recomendaciones automáticas accionables
- Análisis de patrones de respuesta

**Ubicación:** `/services/predictiveEngineService.js`

**Uso básico:**
```javascript
const predictor = require('./services/predictiveEngineService');

// Calcular score avanzado
const score = await predictor.calculateAdvancedLeadScore(tenantId, leadId);
// Retorna: { score, components, recommendation, churnRisk }

// Analizar intención de mensaje
const intention = await predictor.analyzeMessageIntention(
  tenantId, 
  'Quiero comprar ahora',
  leadId
);
// Retorna: { score, level, keywordsMatched, recommendation }
```

---

#### 3. **emailAutomationService.js** ✅
Sistema de automatización de email para secuencias multicanal.

**Características:**
- Envío de emails por proveedor (SendGrid/Mailchimp - configurables)
- Creación de secuencias de nurturing automáticas
- Programación automática de pasos de secuencia
- Tracking de opens, clicks y conversiones
- Estadísticas de desempeño por secuencia

**Ubicación:** `/services/emailAutomationService.js`

**Uso básico:**
```javascript
const emailService = require('./services/emailAutomationService');

// Enviar email
await emailService.sendEmail(tenantId, 'user@email.com', 'Hola', '<html>...</html>', leadId);

// Crear secuencia
const seq = await emailService.createEmailSequence(tenantId, 'Mi Secuencia', [
  {
    delayHours: 0,
    subject: 'Bienvenida',
    htmlContent: '<h1>Bienvenido</h1>'
  },
  {
    delayHours: 24,
    subject: 'Síguenos',
    htmlContent: '<h1>Conoce más</h1>'
  }
]);

// Asignar lead a secuencia
await emailService.assignLeadToSequence(tenantId, leadId, sequenceId);

// Procesar emails programados (ejecutar cada minuto)
await emailService.processScheduledEmails();
```

---

#### 4. **complianceAlertsService.js** ✅
Sistema automático de alertas y monitoreo de compliance LGPD/LFPDPPP.

**Características:**
- Verificación automática de consentimientos faltantes
- Escaneo de datos personales sensibles (PII) en mensajes
- Detección de solicitudes ARCO próximas a vencer
- Identificación de accesos sospechosos
- Generación de reportes para auditoría
- Alertas críticas en tiempo real

**Ubicación:** `/services/complianceAlertsService.js`

**Uso básico:**
```javascript
const compliance = require('./services/complianceAlertsService');

// Obtener estado general
const status = await compliance.getComplianceStatus(tenantId);

// Verificaciones específicas
const consents = await compliance.checkMissingConsents(tenantId);
const pii = await compliance.scanForPII(tenantId);
const arco = await compliance.checkARCORequests(tenantId);

// Generar reporte
const report = await compliance.generateComplianceReport(tenantId, startDate, endDate);

// Iniciar monitoreo automático
await compliance.startComplianceMonitoring(tenantId);
```

---

### Componentes React Creados

#### 1. **WebChatWidget.jsx** ✅
Widget de chat embebible para sitios de tenants.

**Características:**
- Chat flotante responsive
- Integración con backend via API
- Captura automática de leads desde web
- Mensajes de bienvenida personalizados
- Indicadores de escritura en tiempo real
- Sincronización de sesión

**Ubicación:** `/client/src/components/WebChatWidget.jsx`

**Uso:**
```jsx
import WebChatWidget from './components/WebChatWidget';

export default function MyApp() {
  return (
    <WebChatWidget 
      tenantId="tenant-uuid"
      botName="Mi Bot"
    />
  );
}
```

**Instalación en sitios externos:**
```html
<script>
  const tenantId = 'tu-tenant-id';
  const script = document.createElement('script');
  script.src = 'https://botinteligente.com/widget.js';
  document.head.appendChild(script);
</script>
```

---

### Rutas API Creadas

#### 1. **Web Chat Routes** (`/api/web-chat`)
```
POST   /init              - Inicializar sesión de chat
POST   /message           - Procesar mensaje y obtener respuesta IA
POST   /lead-info         - Capturar información del lead
POST   /qualify           - Calificar lead automáticamente
GET    /analytics         - Obtener analytics del canal web
```

**Ejemplo:**
```bash
curl -X POST http://localhost:5000/api/web-chat/init \
  -H "X-Tenant-ID: 123" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "web_widget",
    "userAgent": "Mozilla...",
    "referrer": "https://example.com"
  }'
```

---

#### 2. **Analytics Routes** (`/api/analytics`)
```
GET    /dashboard         - Dashboard general de métricas
GET    /health            - Estado actual del sistema
GET    /trends/:metric    - Tendencias de métrica específica
GET    /channels          - Análisis por canal
POST   /event             - Registrar evento manualmente
```

**Ejemplo:**
```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "X-Tenant-ID: 123"
```

---

#### 3. **Compliance Routes** (`/api/compliance`)
```
GET    /status            - Estado general de compliance
GET    /alerts            - Listar alertas recientes
POST   /check-consents    - Verificar consentimientos
POST   /scan-pii          - Escanear por PII
POST   /check-arco        - Verificar solicitudes ARCO
POST   /check-access      - Detectar accesos sospechosos
GET    /report            - Generar reporte para auditoría
POST   /start-monitoring  - Iniciar monitoreo automático
```

---

## 🗄️ Cambios de Base de Datos Necesarios

### Tablas Nuevas a Crear

```sql
-- Tabla de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tabla de sesiones de chat web
CREATE TABLE IF NOT EXISTS web_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB
);

-- Tabla de historial de email
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
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

-- Tabla de secuencias de email
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255),
  steps JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de asignaciones a secuencias
CREATE TABLE IF NOT EXISTS email_sequence_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  sequence_id UUID REFERENCES email_sequences(id),
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Tabla de programación de emails
CREATE TABLE IF NOT EXISTS email_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  assignment_id UUID REFERENCES email_sequence_assignments(id),
  sequence_id UUID REFERENCES email_sequences(id),
  step_index INTEGER,
  scheduled_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP
);

-- Tabla de alertas de compliance
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  level VARCHAR(50),
  type VARCHAR(100),
  message TEXT,
  metadata JSONB,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de score de leads
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  old_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extensiones a tabla de leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contains_pii BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS predictive_score DECIMAL(5,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_index INTEGER;

-- Extensiones a tabla de lead_messages
ALTER TABLE lead_messages ADD COLUMN IF NOT EXISTS contains_pii BOOLEAN DEFAULT FALSE;
```

---

## 🔧 Pasos de Instalación

### 1. Crear Archivos de Servicios
Los siguientes archivos han sido creados en `/services`:
- ✅ `analyticsService.js`
- ✅ `predictiveEngineService.js`
- ✅ `emailAutomationService.js`
- ✅ `complianceAlertsService.js`

### 2. Crear Rutas API
Los siguientes archivos han sido creados en `/routes`:
- ✅ `webChatRoutes.js`
- ✅ `analyticsRoutes.js`
- ✅ `complianceRoutes.js` (actualizado)

### 3. Crear Componentes React
Los siguientes archivos han sido creados en `/client/src/components`:
- ✅ `WebChatWidget.jsx`

### 4. Actualizar Server
- ✅ Agregadas importaciones de nuevas rutas en `server.js`
- ✅ Registradas nuevas rutas en aplicación Express

### 5. Ejecutar Migraciones de BD
```bash
# Ejecutar script SQL para crear tablas
psql -U postgres -d botinteligente -f scripts/migration_phase1.sql

# O usar el comando de migración existente
npm run migrate
```

### 6. Variables de Entorno a Agregar
```env
# Email Configuration
EMAIL_PROVIDER=sendgrid          # sendgrid, mailchimp, smtp
EMAIL_API_KEY=your_api_key
EMAIL_FROM=no-reply@botinteligente.com

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90

# Compliance
COMPLIANCE_MONITORING_ENABLED=true
COMPLIANCE_CHECK_INTERVAL=6       # horas
```

---

## 🎯 Próximos Pasos - Fase 2

### 1. **Integración de Proveedores de Email**
- Implementar autenticación con SendGrid/Mailchimp
- Configurar webhooks para tracking de opens/clicks
- Crear templates de email responsivos

### 2. **Dashboard de Control**
- Panel de analytics en cliente React
- Dashboard de alertas de compliance
- Estadísticas de secuencias de email

### 3. **SMS y Multicanal Avanzado**
- Integración con Twilio para SMS
- Orquestador de canales (omnichannel manager)
- Sincronización de conversaciones cross-channel

### 4. **IA Mejorada**
- Modelos de detección de intención más precisos
- Análisis de sentimiento
- Respuestas contextuales por tipo de lead

### 5. **Testing**
```bash
npm run test                    # Tests unitarios
npm run test:integration       # Tests de integración
npm run test:analytics         # Tests de analytics
```

---

## 📊 Monitoreo y Operación

### Health Checks
```bash
# Verificar salud del sistema
curl http://localhost:5000/api/analytics/health \
  -H "X-Tenant-ID: 123"
```

### Logs
```bash
# Ver logs de analytics
tail -f logs/analytics.log

# Ver logs de compliance
tail -f logs/compliance.log
```

### Mantenimiento
```bash
# Limpiar eventos antiguos (>90 días)
node scripts/cleanup-old-events.js

# Generar reportes de compliance
node scripts/generate-compliance-reports.js
```

---

## 🚨 Troubleshooting

### Problema: "Email_history table not found"
**Solución:** Ejecutar migraciones de BD: `npm run migrate`

### Problema: "X-Tenant-ID header missing"
**Solución:** Asegurarse que cliente envíe header: `X-Tenant-ID: tenant-uuid`

### Problema: Alerts no se crean
**Solución:** Verificar que `compliance_alerts` tabla exista y RLS esté bien configurado

---

## 📈 KPIs a Monitorear

| Métrica | Meta | Ubicación |
|---------|------|-----------|
| Chat Web Sessions/día | 500+ | `/api/analytics/trends/web` |
| Lead Score Avg | 60+ | `/api/analytics/dashboard` |
| Email Open Rate | 25%+ | `/api/compliance/status` |
| Compliance Score | 80+ | `/api/analytics/health` |
| Sistema Uptime | 99.5%+ | `/api/analytics/health` |

---

## 📚 Documentación Adicional

- [Plan de Arquitectura](./planDeArquitectura.md) - Visión estratégica completa
- API Documentation (OpenAPI/Swagger) - En desarrollo
- Guía de Contribución - Próximamente

---

**Contacto:** david alvarez tovar <da4avid64@gmail.com>  
**Última actualización:** 29 de Diciembre 2025
