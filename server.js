require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Importar cookie-parser

const authRoutes = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { requireAuth, attachUser } = require('./auth/authMiddleware');
const sseController = require('./controllers/sseController');
const { initializeBotsForUser } = require('./services/baileysManager');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(express.static('dist'));
app.use(cookieParser()); // Usar cookie-parser

app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware para adjuntar el usuario a `req` en cada petición
app.use(attachUser);

// Rutas
app.use('/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/leads', leadRoutes);

// Endpoint de Server-Sent Events
app.get('/api/events', requireAuth, sseController.eventsHandler);

// Endpoint para iniciar un bot
app.post('/api/bots/start', requireAuth, async (req, res) => {
    const { botId } = req.body;
    const userId = req.user.id;
    try {
        await initializeBotsForUser(userId); // O uno específico
        res.status(200).send('Bots initializing');
    } catch (error) {
        logger.error({ error: error.message }, "Failed to initialize bots");
        res.status(500).send('Failed to initialize bots');
    }
});

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
