# Estructura del Proyecto

## Resumen de Directorios

Este documento detalla la organización de archivos y directorios del proyecto **WhatsApp Bot Manager**.

*   **`client/`**: La aplicación frontend construida con React.
    *   `src/`
        *   `components/`: Componentes de UI reutilizables (ej. `BotCard`, `ChatInterface`, `ScoringRulesManager`).
        *   `context/`: Proveedores de Contexto React para el estado global (`AuthContext`, `BotsContext`, `UIContext`).
        *   `pages/`: Vistas principales de la aplicación (`Dashboard`, `Login`, `SalesPanel`).
        *   `locales/`: Archivos de traducción para internacionalización (i18n).
        *   `services/`: Capa de servicios para la comunicación con la API del backend.
*   **`services/`**: Lógica de negocio central del backend e integraciones externas.
    *   `baileysManager.js`: Gestiona las conexiones de WhatsApp y el manejo de sockets a través de la librería Baileys.
    *   `bot*Service.js`: Lógica para configuración de bots, operaciones de base de datos e imágenes.
    *   `scheduler*.js`: Manejo de tareas programadas y automatización para los bots.
    *   `lead*Service.js`: Lógica para extracción, gestión e interacción con leads en la base de datos.
    *   `scoringService.js`: Implementa los algoritmos y reglas de puntuación (lead scoring).
    *   `storageService.js`: Gestiona la subida de archivos a Cloudflare R2 o compatible con S3.
*   **`controllers/`**: Manejadores de peticiones Express (Request Handlers).
    *   `sseController.js`: Gestiona los Eventos Enviados por el Servidor (SSE) para actualizaciones en tiempo real.
    *   `webhookController.js`: Maneja webhooks externos (ej. pagos de Stripe).
*   **`routes/`**: Definiciones de rutas de la API (`authRoutes`, `subscriptionRoutes`).
*   **`auth/`**: Configuración de autenticación (Estrategias de Passport.js, middleware de sesión).
*   **`middleware/`**: Middleware personalizado de Express (ej. `quotaMiddleware` para límites de uso).
*   **`migrations/`**: Archivos de migración SQL para versionar el esquema de la base de datos PostgreSQL.
*   **`docs/`**: Documentación del proyecto (API, Arquitectura, Guías).
*   **`server.js`**: El punto de entrada principal del servidor backend, configurando Express, middlewares y rutas.

## Árbol de Archivos Principal

```text
.
├── auth/                   # Lógica de autenticación
├── auth-sessions/          # Sesiones de WhatsApp (Baileys) persistentes
├── client/                 # Frontend React (Vite)
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── locales/
│       ├── pages/
│       └── utils/
├── controllers/            # Controladores de rutas
├── docs/                   # Documentación técnica
├── middleware/             # Middlewares de Express
├── migrations/             # Scripts SQL de migración
├── routes/                 # Definición de endpoints API
├── services/               # Lógica de negocio
├── .env                    # Variables de entorno (no incluido en repo)
├── package.json            # Dependencias y scripts del backend
└── server.js               # Servidor principal