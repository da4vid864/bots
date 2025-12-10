# WhatsApp Bot Manager

A comprehensive, multi-tenant platform for deploying, managing, and scaling AI-powered WhatsApp bots. This system enables businesses to automate customer engagement, capture leads, and coordinate real-time sales interventions through a centralized dashboard.

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-ISC-green)

## 🚀 Key Features

*   **Multi-Bot Orchestration**: Manage multiple WhatsApp instances simultaneously with independent configurations.
*   **AI-Powered Automation**: Integrated DeepSeek AI for intelligent, context-aware conversations.
*   **Smart Lead Capture**: Automatic extraction and scoring of lead information (Name, Email, Location) from natural dialogue.
*   **Real-Time Dashboard**: Live monitoring of bot status, QR code generation, and active conversations via Server-Sent Events (SSE).
*   **Hybrid Sales Control**: Seamless takeover capabilities allowing human agents to intervene in bot conversations.
*   **Role-Based Access**: Granular permissions for Admins and Vendors/Sales Agents.
*   **Enterprise Architecture**: Built on PostgreSQL with connection pooling, implementing a robust React + Node.js stack.

## 🛠️ Technology Stack

*   **Runtime**: Node.js 20+
*   **Frontend**: React 19, Vite 7, Tailwind CSS 4
*   **Backend**: Express.js, Server-Sent Events (SSE)
*   **WhatsApp Engine**: @whiskeysockets/baileys
*   **Database**: PostgreSQL
*   **AI/ML**: DeepSeek API
*   **Auth**: Passport (Google OAuth), JWT
*   **Infrastructure**: Docker/Nixpacks ready (Railway.app optimized)

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

*   [**Architecture Overview**](docs/ARCHITECTURE.md): System design, component interaction, and data flow.
*   [**API Reference**](docs/API.md): Comprehensive guide to REST endpoints and SSE events.
*   [**Lead Scoring System**](docs/LEAD_SCORING.md): Details on the lead qualification algorithm.
*   [**Design System**](docs/DESIGN_SYSTEM.md): UI/UX guidelines and component usage.
*   [**Contributing Guide**](docs/CONTRIBUTING.md): Standards and workflows for developers.

## 🏗️ Architecture

The system follows a modular service-oriented architecture:

```mermaid
graph TB
    subgraph "Frontend"
        REACT[React Dashboard]
    end
    
    subgraph "Backend Services"
        API[Express API]
        SSE[SSE Controller]
        BM[Baileys Manager]
        SCHED[Scheduler]
        AI[DeepSeek Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end
    
    subgraph "External"
        WA[WhatsApp Cloud]
        DS[DeepSeek API]
    end

    REACT <--> API
    REACT <--> SSE
    API --> BM
    BM --> WA
    BM --> AI
    AI --> DS
    BM --> DB
    API --> DB
```

*(See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete detailed diagram)*

## 🚦 Prerequisites

*   Node.js >= 20.0.0
*   PostgreSQL >= 14
*   Google Cloud Console Project (for OAuth)
*   DeepSeek API Key
*   Stripe Account (optional, for subscriptions)

## ⚡ Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd whatsapp-bot-manager
    ```

2.  **Install Dependencies**
    ```bash
    # Install backend dependencies
    npm install

    # Install frontend dependencies
    cd client
    npm install
    cd ..
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    # Core
    PORT=3000
    NODE_ENV=development
    
    # Database
    DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_manager
    
    # Authentication
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    SESSION_SECRET=your_session_secret
    JWT_SECRET=your_jwt_secret
    ADMIN_EMAILS=admin@example.com
    
    # AI Services
    DEEPSEEK_API_KEY=your_key
    
    # Stripe (Optional)
    STRIPE_SECRET_KEY=your_stripe_key
    STRIPE_WEBHOOK_SECRET=your_webhook_secret
    ```

4.  **Database Setup**
    The system will automatically initialize tables on start, or you can run:
    ```bash
    npm run migrate
    ```

## 🚀 Usage

**Development Mode**
Run backend and frontend concurrently with hot-reloading:
```bash
npm run dev
```

**Production Build**
```bash
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on code standards, testing, and pull request procedures.

## 📄 License

This project is licensed under the ISC License.