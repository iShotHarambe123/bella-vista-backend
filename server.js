const express = require('express');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const menuRoutes = require('./routes/menu');
const reservationRoutes = require('./routes/reservations');

// Databas
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'file://',
        'null',
        'https://bella-vista-frontend-hawi2401.netlify.app',
        'https://bella-vista-admin-hawi2401.netlify.app'
    ],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Bella Vista API is running',
        endpoints: {
            health: '/api/health',
            menu: '/api/menu',
            categories: '/api/categories',
            reservations: '/api/reservations',
            auth: '/api/auth'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server körs' });
});

// Starta server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server körs på port ${PORT}`);
    });
}).catch(err => {
    console.error('Kunde inte starta server:', err);
});