# Flujo Completo del Cliente - BotInteligente Manager (WhatsApp Migration Fases 2-4)

## Diagrama de Flujo General

```mermaid
flowchart TD
    A[React Landing Page] --> B[Google OAuth Login]
    B --> C[Selección Plan]
    C --> D{Freemium?}
    D -->|Sí| E[Dashboard Básico]
    D -->|No| F[Checkout Stripe]
    F --> G[Dashboard Premium]
    E --> H[Configuración Bot WhatsApp]
    G --> H
    H --> I[Conectar WhatsApp via QR]
    I --> J[Gestión Bots en Tiempo Real]
    J --> K[Monitoreo y Analytics con SSE]
```

## 1. Acceso a Landing Page React ([`client/src/pages/Login.jsx`](client/src/pages/Login.jsx:1))

**Punto de Entrada:** Cliente accede a la aplicación React con Vite

**Elementos Clave:**
- Hero section con contadores animados (usuarios, leads, conversaciones)
- Sección de características y beneficios
- Casos de éxito y testimonios
- Botón de login con Google OAuth
- Interfaz moderna y responsiva

**Tecnologías:**
- React 18 con Vite para desarrollo rápido
- Tailwind CSS para estilos responsivos
- Componentes modulares y reutilizables
- Context API para estado global

## 2. Proceso de Autenticación con Google OAuth

### 2.1 Flujo de Autenticación Moderno
```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as React Frontend
    participant A as Auth Controller
    participant G as Google OAuth
    participant U as User Service
    participant D as Database

    C->>R: Click "Login with Google"
    R->>A: GET /auth/google
    A->>G: Redirect to Google OAuth
    C->>G: Autoriza aplicación
    G-->>A: OAuth callback con code
    A->>G: Exchange code for tokens
    G-->>A: Access token y user info
    A->>U: findOrCreateUser(googleProfile)
    U->>D: UPSERT users table
    D-->>U: User object
    U-->>A: User con JWT
    A-->>R: Set HTTP-only cookie
    R-->>C: Redirect to Dashboard
```

**Servicios Involucrados:**
- [`auth/authController.js`](auth/authController.js:1) - Manejo de OAuth y JWT
- [`services/userService.js`](services/userService.js:1) - Gestión de usuarios
- [`client/src/context/AuthContext.jsx`](client/src/context/AuthContext.jsx:1) - Estado de autenticación en React

### 2.2 Sistema de Autenticación Modernizado
- **Google OAuth 2.0:** Autenticación segura sin contraseñas
- **JWT Tokens:** Firmados y almacenados en cookies HTTP-only
- **Session Management:** [`useMultiFileAuthState`](services/baileysManager.js:15) para sesiones WhatsApp
- **Context State:** [`AuthContext`](client/src/context/AuthContext.jsx:1) para estado global en React

## 3. Selección de Plan de Suscripción

### 3.1 Modelo Freemium
```mermaid
flowchart LR
    A[Plan Freemium] --> B[1 Bot Activo]
    A --> C[100 Leads/mes]
    A --> D[Funcionalidades Básicas]
    
    E[Plan Premium] --> F[Bots Ilimitados]
    E --> G[Leads Ilimitados]
    E --> H[Imágenes AI]
    E --> I[Analytics Avanzados]
```

### 3.2 Integración con Stripe
```mermaid
sequenceDiagram
    participant C as Cliente
    participant F as Frontend
    participant S as Subscription Service
    participant ST as Stripe API
    participant D as Database

    C->>F: Selecciona plan premium
    F->>S: createSubscription(userId, planId)
    S->>ST: Crear Checkout Session
    ST-->>S: Session ID
    S-->>F: Redirect to Stripe Checkout
    C->>ST: Completa pago
    ST->>S: Webhook payment_succeeded
    S->>D: UPDATE users subscription_status
    S-->>F: Confirmación éxito
    F-->>C: Redirect to dashboard premium
```

**Servicios Involucrados:**
- [`services/subscriptionService.js`](services/subscriptionService.js:1) - Gestión de suscripciones
- Stripe Checkout para procesamiento de pagos
- Webhooks para actualizaciones en tiempo real

## 4. Configuración y Conexión de Bot WhatsApp

### 4.1 Proceso de Conexión con Baileys
```mermaid
flowchart TD
    A[Nuevo Bot WhatsApp] --> B[Configuración Básica]
    B --> C[Conectar WhatsApp]
    C --> D{Escanear QR Code}
    D -->|Éxito| E[Sesión Activa]
    D -->|Falló| F[Reintentar Conexión]
    F --> C
    E --> G[Personalización Avanzada]
    G --> H[Monitoreo en Tiempo Real]
    
    B --> B1[Nombre del Bot]
    B --> B2[Descripción]
    B --> B3[Industria]
    
    G --> G1[Mensaje de Bienvenida]
    G --> G2[Configuración de Respuestas]
    G --> G3[Tono de Conversación]
    
    H --> H1[Estado Conexión]
    H --> H2[Leads Capturados]
    H --> H3[Métricas en Vivo]
```

### 4.2 Gestión de Sesiones con Baileys Manager
```javascript
// Ejemplo de uso del Baileys Manager
const baileysManager = require('./services/baileysManager');

// Inicialización de sesión WhatsApp
const session = await baileysManager.initializeSession(
    userId,
    botConfig,
    onQrCode, // Callback para mostrar QR
    onConnectionUpdate // Callback para estado
);

// Gestión de autenticación multi-archivo
const { state, saveCreds } = await useMultiFileAuthState(
    `./auth-sessions/${userId}`
);
```

**Servicios Involucrados:**
- [`services/baileysManager.js`](services/baileysManager.js:1) - Gestión de conexiones WhatsApp
- [`services/botConfigService.js`](services/botConfigService.js:1) - Configuración de bots
- [`client/src/components/BotCard.jsx`](client/src/components/BotCard.jsx:1) - Componente React para gestión de bots

## 5. Gestión en Dashboard React ([`client/src/pages/Dashboard.jsx`](client/src/pages/Dashboard.jsx:1))

### 5.1 Dashboard Principal con Estado en Tiempo Real
**Componentes:**
- **Resumen de Actividad:** Bots activos, conversaciones, leads capturados
- **Métricas en Tiempo Real:** Usando Server-Sent Events ([`controllers/sseController.js`](controllers/sseController.js:1))
- **Lista de Bots:** Componente [`BotCard`](client/src/components/BotCard.jsx:1) con estado y QR codes
- **Alertas y Notificaciones:** Eventos del sistema via SSE

### 5.2 Creación y Conexión de Bots WhatsApp
```mermaid
sequenceDiagram
    participant U as Usuario
    participant R as React Dashboard
    participant B as Baileys Manager
    participant S as SSE Controller
    participant W as WhatsApp Web

    U->>R: Click "Nuevo Bot WhatsApp"
    R->>B: initializeSession(userId, config)
    B->>W: Iniciar conexión WhatsApp
    W-->>B: Generar QR code
    B-->>S: Emitir evento QR_UPDATE
    S-->>R: Mostrar QR code en tiempo real
    U->>W: Escanear QR con teléfono
    W-->>B: Conexión establecida
    B-->>S: Emitir evento CONNECTION_UPDATE
    S-->>R: Actualizar estado a "Conectado"
    R-->>U: Bot listo para usar
```

### 5.3 Funcionalidades de Gestión Modernizadas

#### 5.3.1 Control de Estado en Tiempo Real
- **Estado Conexión:** Monitoreo continuo via [`SSE`](controllers/sseController.js:25)
- **QR Code Dinámico:** Generación y actualización en tiempo real
- **Reconexión Automática:** Manejo de desconexiones y recuperación

#### 5.3.2 Configuración de Bot WhatsApp
```javascript
// Configuración de bot con Baileys
const botConfig = {
    sessionId: `user-${userId}-bot-${botId}`,
    authState: useMultiFileAuthState(`./auth-sessions/${userId}`),
    browser: ['BotInteligente', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    leadExtraction: {
        enabled: true,
        keywords: ['interesado', 'precio', 'información'],
        qualificationScore: 0.7
    }
};
```

#### 5.3.3 Gestión de Leads y Conversaciones
- **Extracción Automática:** [`services/leadExtractionService.js`](services/leadExtractionService.js:1) integrado con Baileys
- **Calificación Inteligente:** Análisis de conversaciones con [`DeepSeek`](services/deepseekService.js:1)
- **Historial Persistente:** [`services/leadDbService.js`](services/leadDbService.js:1) con metadata WhatsApp

### 5.4 Analytics y Reportes con SSE
**Métricas en Tiempo Real:**
- Estado de conexión WhatsApp
- Leads capturados por bot
- Tasa de respuesta y engagement
- Horarios de actividad pico
- Conversiones y efectividad

## 6. Flujo de Comunicación en Tiempo Real con SSE

### 6.1 Arquitectura Server-Sent Events
```mermaid
flowchart LR
    A[React Frontend] --> B[SSE Controller]
    B --> C[Baileys Manager]
    B --> D[Database Services]
    B --> E[External APIs]
    
    C --> F[WhatsApp Web API]
    F --> G[Usuarios Finales WhatsApp]
    
    B --> H[Event Stream]
    H --> A[Actualizaciones en Tiempo Real]
```

### 6.2 Eventos Principales SSE
- `QR_UPDATE` - Actualización de código QR para conexión
- `CONNECTION_UPDATE` - Cambios de estado de conexión WhatsApp
- `NEW_MESSAGE` - Nuevos mensajes recibidos/enviados
- `LEAD_CAPTURED` - Leads identificados automáticamente
- `BOT_STATUS` - Estado general del bot (activo/inactivo/error)
- `METRICS_UPDATE` - Métricas de performance en tiempo real

## 7. Servicios Clave en el Flujo Modernizado

### 7.1 Baileys Manager ([`services/baileysManager.js`](services/baileysManager.js:1))
- Gestión de sesiones WhatsApp con `useMultiFileAuthState`
- Conexión y reconexión automática
- Emisión de eventos SSE para estado en tiempo real
- Manejo de mensajes y respuestas automáticas

### 7.2 SSE Controller ([`controllers/sseController.js`](controllers/sseController.js:1))
- Stream de eventos en tiempo real para React frontend
- Gestión de conexiones SSE persistentes
- Broadcasting de eventos desde múltiples fuentes
- Reconexión automática en cliente

### 7.3 React Context State Management
- [`AuthContext`](client/src/context/AuthContext.jsx:1) - Estado de autenticación global
- [`BotsContext`](client/src/context/BotsContext.jsx:1) - Estado y gestión de bots
- Integración con SSE para actualizaciones en tiempo real

## 8. Consideraciones de Seguridad y Manejo de Errores

### 8.1 Protección de Datos y Sesiones
- **Sesiones WhatsApp:** Almacenamiento seguro con `useMultiFileAuthState`
- **Tokens JWT:** Cookies HTTP-only con expiración configurable
- **Validación de Entradas:** Sanitización de mensajes y configuraciones
- **Auditoría Completa:** Logs de conexiones y eventos WhatsApp

### 8.2 Manejo de Errores y Recuperación
- **Reconexión Automática:** Recuperación de sesiones WhatsApp interrumpidas
- **Fallback Strategies:** Degradación elegante en errores de API
- **Error Boundaries:** Componentes React con manejo de errores
- **Monitoring SSE:** Detección y recuperación de conexiones perdidas

## 9. Escalabilidad y Performance

### 9.1 Optimizaciones Implementadas
- **Connection Pooling:** PostgreSQL con manejo eficiente de conexiones
- **Caching:** Datos frecuentemente accedidos
- **Background Processing:** Tareas pesadas fuera del request cycle
- **Horizontal Scaling:** Diseñado para múltiples instancias

### 9.2 Monitoreo
- **Health Checks:** Endpoints para verificación de estado
- **Metrics:** Métricas de performance y uso
- **Alerts:** Notificaciones proactivas de issues

---

*Este flujo representa la experiencia completa del usuario desde el descubrimiento del producto hasta el uso avanzado del sistema de gestión de bots, integrando todos los servicios y componentes del ecosistema BotInteligente.*