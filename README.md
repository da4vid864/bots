# WhatsApp Bot Manager

Un panel de control integral para gestionar múltiples bots de WhatsApp, con funcionalidades avanzadas de calificación de leads (lead scoring), CRM, gestión de catálogo de productos y manejo de suscripciones. Construido con tecnología moderna: Node.js, Express, React y Baileys.

## Tabla de Contenidos

*   [Características](#características)
*   [Tecnologías](#tecnologías)
*   [Requisitos Previos](#requisitos-previos)
*   [Instalación](#instalación)
*   [Configuración](#configuración)
*   [Uso](#uso)
*   [Scripts Disponibles](#scripts-disponibles)
*   [Contribuir](#contribuir)
*   [Licencia](#licencia)

## Características

*   **Gestión Multi-Bot**: Conecta y administra múltiples sesiones de WhatsApp simultáneamente desde un solo lugar.
*   **Dashboard en Tiempo Real**: Visualiza el estado de los bots, mensajes entrantes y leads calificados al instante mediante Server-Sent Events (SSE).
*   **Lead Scoring Automatizado**: Sistema de puntuación basado en reglas para calificar leads automáticamente según sus interacciones y palabras clave.
*   **Panel de Ventas y CRM**: Asigna leads a agentes, revisa el historial de conversaciones y envía mensajes directamente desde el dashboard.
*   **Catálogo de Productos**: Gestiona productos e imágenes para compartirlos fácilmente a través de los bots.
*   **Sistema de Suscripciones**: Integración nativa con Stripe para gestionar planes y pagos de usuarios (SaaS).
*   **Autenticación Segura**: Inicio de sesión mediante Google OAuth.

## Tecnologías

*   **Backend**: Node.js, Express, PostgreSQL, Baileys (API de WhatsApp Web), Passport.js.
*   **Frontend**: React, Vite, Tailwind CSS.
*   **Almacenamiento**: Compatible con Cloudflare R2 / AWS S3 (para almacenamiento de imágenes).

## Requisitos Previos

*   **Node.js**: Versión 20.0.0 o superior.
*   **PostgreSQL**: Base de datos relacional.
*   **Google Cloud Console**: Un proyecto configurado para autenticación OAuth 2.0.
*   **Cuenta de Stripe**: Para el procesamiento de pagos (si se usa el módulo de suscripciones).
*   **Almacenamiento S3 Compatible**: Bucket en Cloudflare R2 o AWS S3.

## Instalación

Sigue estos pasos para configurar el proyecto en tu entorno local:

1.  **Clonar el repositorio**

    ```bash
    git clone <url-del-repositorio>
    cd <directorio-del-proyecto>
    ```

2.  **Instalar dependencias del Backend**

    ```bash
    npm install
    ```

3.  **Instalar dependencias del Frontend**

    ```bash
    cd client
    npm install
    cd ..
    ```

4.  **Configurar Variables de Entorno**

    Crea un archivo `.env` en la raíz del proyecto. Puedes usar el siguiente ejemplo como base:

    ```env
    # Servidor
    PORT=3000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:5173

    # Base de Datos
    DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_db

    # Autenticación (Google OAuth)
    GOOGLE_CLIENT_ID=tu_cliente_id_google
    GOOGLE_CLIENT_SECRET=tu_secreto_cliente_google
    SESSION_SECRET=tu_secreto_de_sesion

    # Stripe (Pagos)
    STRIPE_SECRET_KEY=tu_clave_secreta_stripe
    STRIPE_WEBHOOK_SECRET=tu_secreto_webhook_stripe

    # Almacenamiento (Cloudflare R2 / S3)
    R2_ACCESS_KEY_ID=tu_access_key
    R2_SECRET_ACCESS_KEY=tu_secret_key
    R2_BUCKET_NAME=nombre_de_tu_bucket
    R2_ENDPOINT=url_endpoint_s3
    ```

5.  **Ejecutar Migraciones de Base de Datos**

    Inicializa el esquema de la base de datos:

    ```bash
    npm run migrate
    ```

## Uso

### Desarrollo

Para trabajar en el proyecto, necesitarás ejecutar tanto el backend como el frontend (en terminales separadas).

**Terminal 1: Backend**
Inicia el servidor con recarga automática (nodemon):
```bash
npm run dev
```

**Terminal 2: Frontend**
Inicia el servidor de desarrollo de Vite:
```bash
cd client
npm run dev
```
Accede a la aplicación en `http://localhost:5173`.

### Producción

Para desplegar en producción, construye el frontend y sirve todo desde el backend:

```bash
npm run build
npm start
```

## Scripts Disponibles

Definidos en `package.json`:

*   `npm start`: Inicia el servidor en modo producción (`node server.js`).
*   `npm run dev`: Inicia el servidor en modo desarrollo con reinicio automático (`nodemon server.js`).
*   `npm run build:client`: Construye la aplicación de React para producción.
*   `npm run build`: Alias para `build:client`.
*   `npm run serve`: Inicia el servidor forzando `NODE_ENV=production`.
*   `npm run migrate`: Ejecuta los scripts de migración de base de datos (`node migrate.js`).

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, revisa nuestra guía en [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) para conocer los estándares de código y el flujo de trabajo para Pull Requests.

## Licencia

Este proyecto está bajo la Licencia ISC.