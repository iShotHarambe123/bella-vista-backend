const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.NODE_ENV === 'production'
    ? '/tmp/bella_vista.db'
    : path.join(__dirname, '../database/bella_vista.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Databasfel:', err.message);
    } else {
        console.log('Databas ansluten');
    }
});

async function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                // Rensa databas om RESET_DATABASE är satt
                if (process.env.RESET_DATABASE === 'true') {
                    console.log('🔄 Rensar databas...');
                    db.run('DROP TABLE IF EXISTS menu_items');
                    db.run('DROP TABLE IF EXISTS categories');
                    db.run('DROP TABLE IF EXISTS reservations');
                    db.run('DROP TABLE IF EXISTS users');
                }

                // Skapa tabeller
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT DEFAULT 'admin',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS categories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE NOT NULL,
                        description TEXT,
                        sort_order INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS menu_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        price DECIMAL(10,2) NOT NULL,
                        category_id INTEGER,
                        image_url TEXT,
                        is_available BOOLEAN DEFAULT 1,
                        allergens TEXT,
                        sort_order INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_id) REFERENCES categories (id),
                        UNIQUE(name, category_id)
                    )
                `);

                db.run(`
                    CREATE TABLE IF NOT EXISTS reservations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        customer_name TEXT NOT NULL,
                        customer_email TEXT NOT NULL,
                        customer_phone TEXT NOT NULL,
                        reservation_date DATE NOT NULL,
                        reservation_time TIME NOT NULL,
                        party_size INTEGER NOT NULL,
                        special_requests TEXT,
                        status TEXT DEFAULT 'pending',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Rensa eventuella dubbletter
                await cleanupDuplicates();

                await createDefaultData();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function cleanupDuplicates() {
    return new Promise((resolve) => {
        // Ta bort dubbletter från menu_items (behåller den med lägst ID)
        db.run(`
            DELETE FROM menu_items 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM menu_items 
                GROUP BY name, category_id
            )
        `, [], (err) => {
            if (err) console.log('Inga dubbletter att rensa');
            resolve();
        });
    });
}

async function createDefaultData() {
    return new Promise((resolve) => {
        // Skapa admin-användare
        db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
            if (!err && result.count === 0) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);
                db.run(
                    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
                    ['admin', 'admin@bellavista.se', hashedPassword, 'admin'],
                    (err) => {
                        if (err) console.error('Fel vid skapande av admin:', err);
                        else console.log('Admin-användare skapad');
                    }
                );
            }
        });

        // Skapa kategorier
        db.get('SELECT COUNT(*) as count FROM categories', [], (err, result) => {
            if (!err && result.count === 0) {
                const categories = [
                    { name: 'Antipasti', description: 'Förrätter', sort_order: 1 },
                    { name: 'Primi Piatti', description: 'Pasta och risotto', sort_order: 2 },
                    { name: 'Secondi Piatti', description: 'Huvudrätter', sort_order: 3 },
                    { name: 'Dolci', description: 'Efterrätter', sort_order: 4 }
                ];

                categories.forEach((category, index) => {
                    db.run(
                        `INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`,
                        [category.name, category.description, category.sort_order],
                        (err) => {
                            if (err) console.error('Fel vid skapande av kategori:', err);
                            else console.log(`Kategori skapad: ${category.name}`);
                        }
                    );
                });
            }
        });

        // Skapa exempel-meny
        setTimeout(() => {
            db.get('SELECT COUNT(*) as count FROM menu_items', [], (err, result) => {
                if (!err && result.count === 0) {
                    const menuItems = [
                        { name: 'Bruschetta', description: 'Rostade bröd med tomater', price: 95, category_name: 'Antipasti' },
                        { name: 'Spaghetti Carbonara', description: 'Pasta med ägg och bacon', price: 185, category_name: 'Primi Piatti' },
                        { name: 'Osso Buco', description: 'Kalvskank med risotto', price: 295, category_name: 'Secondi Piatti' },
                        { name: 'Tiramisu', description: 'Klassisk italiensk dessert', price: 95, category_name: 'Dolci' }
                    ];

                    menuItems.forEach(item => {
                        // Hitta kategori-ID baserat på namn
                        db.get('SELECT id FROM categories WHERE name = ?', [item.category_name], (err, category) => {
                            if (err || !category) {
                                console.error(`Kunde inte hitta kategori: ${item.category_name}`);
                                return;
                            }

                            db.run(
                                `INSERT INTO menu_items (name, description, price, category_id) VALUES (?, ?, ?, ?)`,
                                [item.name, item.description, item.price, category.id],
                                (err) => {
                                    if (err) console.error('Fel vid skapande av menyrätt:', err);
                                    else console.log(`Menyrätt skapad: ${item.name} i kategori ${item.category_name}`);
                                }
                            );
                        });
                    });
                }
                resolve();
            });
        }, 200);
    });
}

module.exports = { db, initDatabase };