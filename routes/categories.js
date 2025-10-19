const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Hämta alla kategorier
router.get('/', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY sort_order, name', [], (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        res.json(categories);
    });
});

// Hämta en kategori
router.get('/:id', (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        if (!category) {
            return res.status(404).json({ error: 'Kategori hittades inte' });
        }
        res.json(category);
    });
});

// Skapa ny kategori
router.post('/', authenticateToken, (req, res) => {
    const { name, description, sort_order } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Namn krävs' });
    }

    db.run(
        'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)',
        [name, description || '', sort_order || 0],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            res.json({ message: 'Kategori skapad', id: this.lastID });
        }
    );
});

// Uppdatera kategori
router.put('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { name, description, sort_order } = req.body;

    db.run(
        'UPDATE categories SET name = ?, description = ?, sort_order = ? WHERE id = ?',
        [name, description || '', sort_order || 0, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Kategori hittades inte' });
            }
            res.json({ message: 'Kategori uppdaterad' });
        }
    );
});

// Ta bort kategori
router.delete('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;

    // Kolla om kategorin används
    db.get('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }

        if (result.count > 0) {
            return res.status(400).json({ error: 'Kategorin används av menyrätter' });
        }

        db.run('DELETE FROM categories WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Kategori hittades inte' });
            }
            res.json({ message: 'Kategori borttagen' });
        });
    });
});

module.exports = router;