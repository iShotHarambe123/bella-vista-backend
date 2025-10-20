const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Hämta alla menyrätter
router.get('/', (req, res) => {
    const query = `
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE mi.is_available = 1
        ORDER BY c.sort_order, mi.sort_order, mi.name
    `;

    db.all(query, [], (err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }

        // Gruppera per kategori
        const menuByCategory = {};
        items.forEach(item => {
            const categoryName = item.category_name || 'Övrigt';
            if (!menuByCategory[categoryName]) {
                menuByCategory[categoryName] = {
                    category: {
                        id: item.category_id,
                        name: categoryName,
                        description: ''
                    },
                    items: []
                };
            }
            menuByCategory[categoryName].items.push(item);
        });

        res.json({
            menu: Object.values(menuByCategory),
            totalItems: items.length
        });
    });
});

// Hämta alla menyrätter (för admin)
router.get('/all', authenticateToken, (req, res) => {
    const query = `
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id
        ORDER BY c.sort_order, mi.sort_order, mi.name
    `;

    db.all(query, [], (err, items) => {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        res.json(items);
    });
});

// Hämta en menyrätt
router.get('/:id', (req, res) => {
    const id = req.params.id;

    db.get(
        'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.id = ?',
        [id],
        (err, item) => {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            if (!item) {
                return res.status(404).json({ error: 'Menyrätt hittades inte' });
            }
            res.json(item);
        }
    );
});

// Skapa ny menyrätt
router.post('/', authenticateToken, (req, res) => {
    const { name, description, price, category_id, image_url, is_available, allergens, sort_order } = req.body;

    if (!name || !price || !category_id) {
        return res.status(400).json({ error: 'Namn, pris och kategori krävs' });
    }

    db.run(
        `INSERT INTO menu_items (name, description, price, category_id, image_url, is_available, allergens, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description || '', price, category_id, image_url || '', is_available !== false, allergens || '', sort_order || 0],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            res.json({ message: 'Menyrätt skapad', id: this.lastID });
        }
    );
});

// Uppdatera menyrätt
router.put('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { name, description, price, category_id, image_url, is_available, allergens, sort_order } = req.body;

    db.run(
        `UPDATE menu_items SET name = ?, description = ?, price = ?, category_id = ?, 
         image_url = ?, is_available = ?, allergens = ?, sort_order = ? WHERE id = ?`,
        [name, description || '', price, category_id, image_url || '', is_available !== false, allergens || '', sort_order || 0, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Databasfel' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Menyrätt hittades inte' });
            }
            res.json({ message: 'Menyrätt uppdaterad' });
        }
    );
});

// Ta bort menyrätt
router.delete('/:id', authenticateToken, (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM menu_items WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Databasfel' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Menyrätt hittades inte' });
        }
        res.json({ message: 'Menyrätt borttagen' });
    });
});

module.exports = router;