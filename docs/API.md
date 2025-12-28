# Documentación de la API

Este documento proporciona una visión general de los endpoints de la API disponibles en el sistema, enfocándose en Autenticación, Suscripciones y Eventos en Tiempo Real (SSE).

## Rutas de Autenticación
Ruta base: `/auth`

*   `GET /auth/google`: Inicia el flujo de inicio de sesión con Google OAuth2. Scopes: `profile`, `email`.
*   `GET /auth/google/callback`: URL de callback para Google OAuth2. Redirecciones:
    *   Éxito: Maneja la lógica del callback y redirecciona al dashboard/panel.
    *   Fallo: Redirecciona a `/login`.
*   `GET /auth/logout`: Cierra la sesión del usuario actual.

## Rutas de Suscripción
Ruta base: `/subs`

*   `GET /subs/purchase/pro`: Inicia el flujo de compra o prueba para el plan Pro.
    *   Si no ha iniciado sesión: "If the user is not logged in, a cookie is set to store the intended destination (the Pro plan purchase flow) and the user is redirected to the login page. After successful login, the user will be redirected back to this purchase flow."
    *   Si ha iniciado sesión: "If the user is logged in, a trial for the Pro plan is activated and the user is redirected to the dashboard."
*   `POST /subs/start-trial`: Endpoint API para activar explícitamente una prueba para un usuario autenticado.
*   `GET /subs/portal`: Redirecciona al usuario al portal de facturación de Stripe para gestionar suscripciones.

## Eventos Enviados por el Servidor (SSE)
Ruta base: `/api/events`

El sistema utiliza Server-Sent Events para enviar actualizaciones en tiempo real al frontend.

*   **Endpoint**: `GET /api/events`
*   **Autenticación**: Requerida (Sesión basada en cookies)
*   **Tipos de Eventos**:
    *   `CONNECTED`: Conexión establecida.
    *   `UPDATE_BOT`: Actualizaciones de estado del bot (QR generado, conectado, desconectado, deshabilitado/habilitado).
    *   `NEW_QUALIFIED_LEAD`: Notificación cuando un lead cumple con los criterios de calificación.
    *   `NEW_MESSAGE_FOR_SALES`: Nuevo mensaje que requiere atención de ventas.
    *   `LEAD_ASSIGNED`: Un lead ha sido asignado a un vendedor.
    *   `MESSAGE_SENT`: Confirmación de mensaje enviado.
    *   `LEAD_MESSAGES`: Historial de mensajes de un lead específico (respuesta a solicitud).
    *   `INIT`: Datos iniciales de los bots.
    *   `INIT_LEADS`: Datos iniciales de los leads.
    *   `STATS_UPDATE`: Actualización de estadísticas del dashboard.

## Rutas Generales de la API
Ruta base: `/api`

### Estado de Autenticación
*   `GET /api/auth/status`: Verifica si la sesión actual está autenticada. Retorna detalles del usuario si es verdadero.

### Dashboard y Datos
*   `GET /api/dashboard`: (Solo Admin) Retorna datos del dashboard incluyendo estado de pagos.
*   `GET /api/sales`: Retorna datos relacionados con ventas para el usuario autenticado.
*   `GET /api/landing`: Retorna datos públicos para la landing page.
*   `GET /api/initial-data`: Dispara la carga inicial de datos vía SSE.

### Gestión de Bots (Admin)
*   `POST /api/create-bot`: Crea una nueva instancia de bot.
*   `PATCH /api/edit-bot/:id`: Actualiza la configuración del bot (ej. prompt).
*   `DELETE /api/delete-bot/:id`: Elimina una instancia de bot.
*   `POST /api/disable-bot/:id`: Pausa un bot.
*   `POST /api/enable-bot/:id`: Reanuda un bot.

### Operaciones con Leads
*   `POST /api/assign-lead`: Asigna un lead a un usuario.
*   `POST /api/send-message`: Envía un mensaje de WhatsApp a un lead.
*   `GET /api/lead-messages/:leadId`: Solicita el historial de mensajes de un lead (entregado vía SSE).

### Imágenes
*   `POST /api/bot/:botId/images`: Sube una imagen para un bot.
*   `GET /api/bot/:botId/images`: Lista las imágenes de un bot.
*   `DELETE /api/images/:imageId`: Elimina una imagen.

### Gestión de Equipo (Admin)
*   `GET /api/team`: Lista los miembros del equipo.
*   `POST /api/team`: Añade un miembro al equipo.
*   `PATCH /api/team/:id/toggle`: Habilita/deshabilita un miembro del equipo.
*   `DELETE /api/team/:id`: Elimina un miembro del equipo.

### Programación (Scheduling)
*   `GET /api/bot/:id/schedules`: Lista tareas programadas para un bot.
*   `POST /api/schedules`: Crea una tarea programada.
*   `DELETE /api/schedules/:id`: Cancela una tarea programada.

### Reglas de Puntuación (Scoring)
*   `GET /api/scoring-rules/:botId`: Obtiene las reglas de puntuación.
*   `POST /api/scoring-rules/:botId`: Crea una regla de puntuación.
*   `DELETE /api/scoring-rules/:ruleId`: Elimina una regla de puntuación.

### Catálogo de Productos
*   `GET /api/products/:botId`: Obtiene los productos.
*   `POST /api/products/:botId`: Añade un producto.
*   `PUT /api/products/:id`: Actualiza un producto.
*   `DELETE /api/products/:id`: Elimina un producto.
*   `POST /api/products/:id/image`: Sube una imagen para un producto.