# Flujo de Usuario: De Visitante a Cliente Pro
## Arquitectura de Adquisición y Gestión

Este documento detalla el flujo técnico implementado para manejar la conversión de usuarios, soportando el escenario donde un usuario decide comprar *antes* de tener una cuenta.

### Diagrama de Estados Global

```mermaid
stateDiagram-v2
    [*] --> LandingPage
    
    state "Landing Page (React)" as LandingPage {
        [*] --> ViewContent
        ViewContent --> ClickLogin: Botón "Log In"
        ViewContent --> ClickBuy: Botón "Upgrade Pro"
    }

    state "Backend Auth Logic" as AuthLogic {
        ClickLogin --> GoogleOAuth: Flujo Estándar
        ClickBuy --> InterceptMiddleware: Flujo de Compra
        
        state "Intercept Middleware" as InterceptMiddleware {
            IsAuthenticated? --> Yes: Redirigir a Stripe
            IsAuthenticated? --> No: Set Cookie 'intent=buy_pro'
            No --> GoogleOAuth
        }
    }

    state "Google OAuth Callback" as Callback {
        GoogleSuccess --> CheckCookie
        CheckCookie --> HasIntent: Cookie 'intent' existe?
        HasIntent --> StripeCheckout: Sí -> Redirigir a Stripe
        HasIntent --> Dashboard: No -> Redirigir a Dashboard
    }

    state "Stripe Checkout" as Stripe {
        PaymentSuccess --> WebhookHandler
        WebhookHandler --> UpdateDB: Activar Suscripción
        PaymentSuccess --> DashboardSuccess: Redirigir usuario
    }

    state "Dashboard (React)" as Dashboard {
        DashboardSuccess --> ShowWelcomePro: Query ?payment=success
        Dashboard --> NormalView
    }
```

### Detalle Técnico por Fase

#### 1. Fase de Selección (Landing)
- **Archivo:** `client/src/pages/Login.jsx`
- **Acción A (Free/Login):** Llama a `login()` del AuthContext -> `window.location.href = '/auth/google'`
- **Acción B (Comprar Pro):** Navegación directa -> `window.location.href = '/subs/purchase/pro'`

#### 2. Fase de Intercepción (Backend)
- **Archivo:** `routes/subscriptionRoutes.js`
- **Ruta:** `GET /purchase/pro`
- **Lógica:**
  1. Verifica `req.user`.
  2. **Si existe:** Crea sesión de Stripe y redirige.
  3. **Si NO existe:** 
     - Crea cookie HTTP-Only: `redirect_to_checkout=true`.
     - Redirige a `/auth/google`.

#### 3. Fase de Resolución (Auth Controller)
- **Archivo:** `auth/authController.js`
- **Función:** `handleGoogleCallback`
- **Lógica:**
  1. Procesa usuario de Google (crear/actualizar).
  2. Genera JWT.
  3. **Check de Intención:** Lee `req.cookies.redirect_to_checkout`.
  4. **Si es 'true':** 
     - Borra la cookie.
     - Redirige a `/subs/purchase/pro` (ahora autenticado).
  5. **Si es undefined:**
     - Redirige a `/dashboard`.

#### 4. Fase de Confirmación (Dashboard)
- **Archivo:** `client/src/pages/Dashboard.jsx`
- **Lógica:** Lee `useSearchParams` buscando `payment=success`.
- **UI:** Muestra confeti o modal de bienvenida al plan Pro.
