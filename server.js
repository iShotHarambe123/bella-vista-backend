const express = require('express');
const cors = require('cors');

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
        'https://bella-vista-frontend.netlify.app',
        'https://bella-vista-admin.netlify.app'
    ],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server körs' });
});

// Starta server
app.listen(PORT, () => {
    console.log(`Server körs på port ${PORT}`);
});