# Project Structure

## Directory Overview

*   **`client/`**: The React frontend application.
    *   `src/`
        *   `components/`: Reusable UI components (e.g., `BotCard`, `ChatInterface`, `ScoringRulesManager`).
        *   `context/`: React Context providers for global state (`AuthContext`, `BotsContext`, `UIContext`).
        *   `pages/`: Main application views (`Dashboard`, `Login`, `SalesPanel`).
        *   `locales/`: i18n translation files.
        *   `services/`: Frontend API service layers.
*   **`services/`**: Core backend business logic and external integrations.
    *   `baileysManager.js`: Manages WhatsApp connections and socket handling via Baileys.
    *   `bot*Service.js`: Logic for Bot configuration, DB operations, and images.
    *   `scheduler*.js`: Handling scheduled tasks and automation for bots.
    *   `lead*Service.js`: Logic for lead extraction, management, and database interactions.
    *   `scoringService.js`: Implements the lead scoring algorithms.
    *   `storageService.js`: Handles file uploads to Cloudflare R2/S3.
*   **`controllers/`**: Express request handlers.
    *   `sseController.js`: Manages Server-Sent Events for real-time client updates.
    *   `webhookController.js`: Handles external webhooks (e.g., Stripe payments).
*   **`routes/`**: API route definitions (`authRoutes`, `subscriptionRoutes`).
*   **`auth/`**: Authentication setup (Passport.js strategies, middleware).
*   **`middleware/`**: Custom Express middleware (e.g., `quotaMiddleware`).
*   **`migrations/`**: SQL migration files for versioning the PostgreSQL database schema.
*   **`server.js`**: The main entry point for the backend server, configuring Express and middlewares.