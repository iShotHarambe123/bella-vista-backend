const jwt = require('jsonwebtoken');

const JWT_SECRET = 'bella_vista_secret_key_2024';

// Kontrollera JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token krävs' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Ogiltig token' });
        }
        req.user = user;
        next();
    });
}

// Skapa JWT token
function generateToken(user) {
    return jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });
}

module.exports = {
    authenticateToken,
    generateToken
};