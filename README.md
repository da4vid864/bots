# WhatsApp Bot Manager

A comprehensive dashboard to manage multiple WhatsApp bots, featuring automated lead scoring, CRM capabilities, product catalog management, and subscription handling. Built with Node.js, Express, React, and Baileys.

## Features

*   **Multi-Bot Management**: Connect and manage multiple WhatsApp sessions simultaneously.
*   **Real-time Dashboard**: Live updates on bot status, messages, and leads using Server-Sent Events (SSE).
*   **Lead Scoring**: Automated rule-based scoring to qualify leads based on interactions.
*   **CRM & Sales Panel**: Assign leads to agents, view message history, and send messages directly from the dashboard.
*   **Product Catalog**: Manage products and images to share via bots.
*   **Subscription System**: Integrated with Stripe for user subscriptions.
*   **Google Authentication**: Secure login using Google OAuth.

## Tech Stack

*   **Backend**: Node.js, Express, PostgreSQL, Baileys (WhatsApp Web API), Passport.js
*   **Frontend**: React, Vite, Tailwind CSS
*   **Storage**: Cloudflare R2 / AWS S3 compatible (for image storage)

## Prerequisites

*   Node.js (v20+ recommended)
*   PostgreSQL Database
*   Google Cloud Console Project (for OAuth)
*   Stripe Account (for payments)
*   Cloudflare R2 or AWS S3 compatible storage buckets

## Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Backend Dependencies**

    ```bash
    npm install
    ```

3.  **Install Frontend Dependencies**

    ```bash
    cd client
    npm install
    cd ..
    ```

4.  **Environment Configuration**

    Create a `.env` file in the root directory with the following variables:

    ```env
    # Server
    PORT=3000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:5173

    # Database
    DATABASE_URL=postgresql://user:password@localhost:5432/dbname

    # Authentication (Google)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    SESSION_SECRET=your_session_secret

    # Stripe
    STRIPE_SECRET_KEY=your_stripe_secret_key
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

    # Storage (Cloudflare R2 / S3)
    R2_ACCESS_KEY_ID=your_access_key
    R2_SECRET_ACCESS_KEY=your_secret_key
    R2_BUCKET_NAME=your_bucket_name
    R2_ENDPOINT=your_endpoint_url
    ```

5.  **Database Migration**

    Initialize the database schema:

    ```bash
    npm run migrate
    ```

## Usage

### Development

**Backend:**
Start the backend server with hot-reloading:
```bash
npm run dev
```

**Frontend:**
In a separate terminal, start the Vite development server:
```bash
cd client
npm run dev
```

### Production

Build the frontend and serve it via the backend:

```bash
npm run build
npm start