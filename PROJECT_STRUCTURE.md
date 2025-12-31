# Estructura del Proyecto

## Resumen de Arquitectura

El proyecto **WhatsApp Bot Manager** sigue una arquitectura **Monolítica Modular** con un frontend Single Page Application (SPA).

*   **Frontend**: React + Vite (alojado en `client/`). Consume la API REST del backend.
*   **Backend**: Node.js + Express (punto de entrada `server.js`). Maneja la lógica de negocio, conexiones a WhatsApp, y persistencia de datos.
*   **Base de Datos**: PostgreSQL (gestionado vía migraciones SQL).
*   **WhatsApp**: Integración mediante la librería `Baileys` para manejo de sockets y protocolo WhatsApp Web.
*   **Almacenamiento**: Soporte para almacenamiento de archivos (imágenes) compatible con S3/R2.

## Estructura de Directorios

### 1. Backend (`/`)

El directorio raíz contiene la configuración del servidor y los módulos del backend.

*   **`server.js`**: Punto de entrada principal. Configura Express, Middlewares (CORS, Passport, Body Parser), Rutas API, y tareas programadas.
*   **`auth/`**: Configuración de autenticación.
    *   `passport.js`: Estrategias de autenticación (Local, JWT, etc.).
*   **`auth-sessions/`**: Almacenamiento de sesiones persistentes de WhatsApp (Baileys) y credenciales de autenticación.
*   **`controllers/`**: Manejadores de lógica de petición/respuesta.
    *   `complianceController.js`: Gestión de cumplimiento normativo.
    *   `sseController.js`: Manejo de Server-Sent Events para actualizaciones en tiempo real al frontend.
    *   `webhookController.js`: Integraciones con servicios externos (Stripe, etc.).
*   **`middleware/`**: Interceptores de peticiones HTTP.
    *   `quotaMiddleware.js`: Control de límites de uso.
    *   `tenantMiddleware.js`: Aislamiento lógico de datos por usuario/inquilino.
    *   `validationMiddleware.js`: Validación de datos de entrada.
*   **`migrations/`**: Scripts SQL versionados para la evolución del esquema de la base de datos.
*   **`routes/`**: Definición de endpoints de la API REST.
    *   `analyticsRoutes.js`: Endpoints para métricas y estadísticas.
    *   `analyzedChatsRoutes.js`: Gestión de chats analizados por IA.
    *   `authRoutes.js`: Registro, login y gestión de sesión.
    *   `complianceRoutes.js`: Rutas de auditoría y cumplimiento.
    *   `dataIntegrityRoutes.js`: Verificación de integridad de datos.
    *   `leadRoutes.js`: Gestión de leads (clientes potenciales).
    *   `subscriptionRoutes.js`: Manejo de suscripciones y pagos.
    *   `webChatRoutes.js`: API para el widget de chat web.
*   **`services/`**: Núcleo de la lógica de negocio.
    *   `baileysManager.js` & `baileysAuthService.js`: Gestión de conexiones y autenticación de WhatsApp.
    *   `bot*Service.js`: Configuración, base de datos e imágenes de los bots.
    *   `chatAnalysisService.js` & `deepseekService.js`: Integración con IA para análisis de conversaciones y sugerencias.
    *   `lead*Service.js`: Gestión y extracción de leads.
    *   `pipelineService.js`: Gestión de flujos de ventas (CRM Kanban).
    *   `scheduler*Service.js`: Automatización y tareas programadas.
    *   `scoringService.js`: Motor de puntuación de leads.
    *   `statsService.js` & `analyticsService.js`: Generación de reportes y dashboards.
    *   `storageService.js`: Abstracción de almacenamiento de archivos (S3/R2).

### 2. Frontend (`client/`)

Aplicación React construida con Vite y Tailwind CSS.

*   **`src/`**: Código fuente.
    *   **`assets/`**: Imágenes, logos y recursos estáticos.
    *   **`components/`**: Biblioteca de componentes UI.
        *   `atoms/`, `molecules/`, `organisms/`, `templates/`: Organización Atomic Design.
        *   Componentes clave: `BotCard`, `ChatInterface`, `KanbanPipeline`, `PipelineBoardEnhanced`.
    *   **`context/`**: Estado global de la aplicación.
        *   `AuthContext.jsx`: Estado de sesión del usuario.
        *   `BotsContext.jsx`: Estado de los bots y conexiones.
        *   `UIContext.jsx`: Control de interfaz (modales, notificaciones).
    *   **`locales/`**: Archivos JSON para internacionalización (i18n) en Español e Inglés.
    *   **`pages/`**: Vistas principales (Rutas).
        *   `Dashboard.jsx`: Panel principal con métricas.
        *   `SalesPanelEnhanced.jsx`: Interfaz avanzada de gestión de ventas y chats.
        *   `Login.jsx`: Autenticación.
    *   **`utils/`**: Funciones auxiliares y configuración de cliente API (`api.js`).

### 3. Documentación y Configuración

*   **`docs/`**: Documentación técnica detallada (`API.md`, `ARCHITECTURE.md`, `LEAD_SCORING.md`, etc.).
*   **Archivos de Configuración Clave**:
    *   `.env`: Variables de entorno (Credenciales, claves API, configuración de DB).
    *   `package.json`: Dependencias y scripts del proyecto.
    *   `railway.json`: Configuración de despliegue en Railway.
    *   `nixpacks.toml`: Configuración de construcción de contenedores.
    *   `vite.config.ts`: Configuración del bundler Vite.
    *   `tailwind.config.js`: Configuración de estilos Tailwind.

## Flujo de Datos Principal

1.  **Recepción de Mensajes**: `Baileys` (Socket) -> `baileysManager` -> `handleBotMessage` (server.js) -> `leadDbService` (Persistencia) -> `sseController` (Notificación al Frontend).
2.  **Interacción de Usuario (Frontend)**: `ChatInterface` -> `api.js` (Axios) -> `server.js` (Express) -> `routes/` -> `controllers/` -> `services/`.
3.  **Análisis IA**: Mensaje recibido -> `chatAnalysisService` -> `deepseekService` (API Externa) -> Resultado almacenado/enviado.