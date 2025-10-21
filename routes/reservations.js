const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Hämta alla reservationer
router.get('/', authenticateToken, (req, res) => {
    db.all('SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC', [], (err, reservations) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        res.json(reservations);
    });
});

// Hämta en reservation
router.get('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM reservations WHERE id = ?', [id], (err, reservation) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation hittades inte' });
        }
        res.json(reservation);
    });
});

// Skapa ny reservation
router.post('/', (req, res) => {
    const { customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, special_requests } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !reservation_date || !reservation_time || !party_size) {
        return res.status(400).json({ error: 'Alla obligatoriska fält krävs' });
    }

    db.run(
        `INSERT INTO reservations (customer_name, customer_email, customer_phone, reservation_date, 
         reservation_time, party_size, special_requests, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, special_requests || ''],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            res.json({
                message: 'Reservation skapad',
                id: this.lastID,
                confirmationMessage: `Tack ${customer_name}! Din reservation är mottagen.`
            });
        }
    );
});

// Uppdatera reservationsstatus
router.put('/:id/status', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status krävs' });
    }

    db.run('UPDATE reservations SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reservation hittades inte' });
        }
        res.json({ message: 'Status uppdaterad' });
    });
});

// Ta bort reservation
router.delete('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM reservations WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Reservation hittades inte' });
        }
        res.json({ message: 'Reservation borttagen' });
    });
});

module.exports = router;