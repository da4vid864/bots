# API Documentation

This document provides a high-level overview of the API endpoints available in the system, focusing on Authentication, Subscription, and Real-time Events (SSE).

## Authentication Routes
Base path: `/auth`

*   `GET /auth/google`: Initiates Google OAuth2 login flow. Scopes: `profile`, `email`.
*   `GET /auth/google/callback`: Callback URL for Google OAuth2. Redirections:
    *   Success: Handle callback logic.
    *   Failure: Redirects to `/login`.
*   `GET /auth/logout`: Logs out the current user.

## Subscription Routes
Base path: `/subs`

*   `GET /subs/purchase/pro`: Initiates the purchase or trial flow for the Pro plan.
    *   If not logged in, sets a cookie and redirects to login.
    *   If logged in, activates trial and redirects to dashboard.
*   `POST /subs/start-trial`: API endpoint to explicitly activate a trial for an authenticated user.
*   `GET /subs/portal`: Redirects the user to the Stripe billing portal for managing subscriptions.

## Server-Sent Events (SSE)
Base path: `/api/events`

The system uses Server-Sent Events to push real-time updates to the frontend.

*   **Endpoint**: `GET /api/events`
*   **Authentication**: Required (Cookie-based session)
*   **Event Types**:
    *   `CONNECTED`: Connection established.
    *   `UPDATE_BOT`: Bot status updates (QR generated, connected, disconnected, disabled/enabled).
    *   `NEW_QUALIFIED_LEAD`: Notification when a lead meets qualification criteria.
    *   `NEW_MESSAGE_FOR_SALES`: New message needing attention.
    *   `LEAD_ASSIGNED`: A lead has been assigned to a vendor.
    *   `MESSAGE_SENT`: Confirmation of a sent message.
    *   `LEAD_MESSAGES`: Bulk messages for a specific lead (response to request).
    *   `INIT`: Initial bot data.
    *   `INIT_LEADS`: Initial leads data.

## General API Routes
Base path: `/api`

### Authentication Status
*   `GET /api/auth/status`: Checks if the current session is authenticated. Returns user details if true.

### Dashboard & Data
*   `GET /api/dashboard`: (Admin only) Returns dashboard data including payment status.
*   `GET /api/sales`: Returns sales-related data for the authenticated user.
*   `GET /api/landing`: Returns public landing page data.
*   `GET /api/initial-data`: Trigger initial data load via SSE.

### Bot Management (Admin)
*   `POST /api/create-bot`: Create a new bot instance.
*   `PATCH /api/edit-bot/:id`: Update bot configuration (e.g., prompt).
*   `DELETE /api/delete-bot/:id`: Remove a bot instance.
*   `POST /api/disable-bot/:id`: Pause a bot.
*   `POST /api/enable-bot/:id`: Resume a bot.

### Lead Operations
*   `POST /api/assign-lead`: Assign a lead to a user.
*   `POST /api/send-message`: Send a WhatsApp message to a lead.
*   `GET /api/lead-messages/:leadId`: Request message history for a lead (delivered via SSE).

### Images
*   `POST /api/bot/:botId/images`: Upload an image for a bot.
*   `GET /api/bot/:botId/images`: List images for a bot.
*   `DELETE /api/images/:imageId`: Delete an image.

### Team Management (Admin)
*   `GET /api/team`: List team members.
*   `POST /api/team`: Add a team member.
*   `PATCH /api/team/:id/toggle`: Enable/disable a team member.
*   `DELETE /api/team/:id`: Remove a team member.

### Scheduling
*   `GET /api/bot/:id/schedules`: List scheduled tasks for a bot.
*   `POST /api/schedules`: Create a scheduled task.
*   `DELETE /api/schedules/:id`: Cancel a schedule.

### Scoring Rules
*   `GET /api/scoring-rules/:botId`: Get scoring rules.
*   `POST /api/scoring-rules/:botId`: Create a scoring rule.
*   `DELETE /api/scoring-rules/:ruleId`: Delete a scoring rule.

### Product Catalog
*   `GET /api/products/:botId`: Get products.
*   `POST /api/products/:botId`: Add a product.
*   `PUT /api/products/:id`: Update a product.
*   `DELETE /api/products/:id`: Delete a product.