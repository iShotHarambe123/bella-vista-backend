# Bella Vista Backend API

REST API för Bella Vista Ristorante - en italiensk restaurang som erbjuder komplett menyhantering och bordsreservationssystem. [Länk](https://bella-vista-backend.onrender.com)

## 📋 Översikt

Detta är backend-API:et för Bella Vista Ristorante som tillhandahåller:

- **Menyhantering** - CRUD-operationer för rätter och kategorier
- **Reservationssystem** - Hantering av bordsreservationer
- **Användarautentisering** - JWT-baserad säkerhet för admin-funktioner
- **RESTful API** - Strukturerade endpoints för frontend-integration

### Första inloggning

- **Användarnamn:** `admin`
- **Lösenord:** `admin123`

## 🛠 Teknisk Stack

| Teknologi      | Syfte                 | Version |
| -------------- | --------------------- | ------- |
| **Node.js**    | Runtime environment   | ≥16.0.0 |
| **Express.js** | Web framework         | ^4.18.2 |
| **SQLite3**    | Relationsdatabas      | ^5.1.6  |
| **JWT**        | Autentisering         | ^9.0.2  |
| **bcryptjs**   | Lösenordskryptering   | ^2.4.3  |
| **CORS**       | Cross-origin requests | ^2.8.5  |

## 📡 API Endpoints

### Publika Endpoints

Dessa endpoints kräver ingen autentisering:

```http
GET    /                          # API information
GET    /api/health                # Health check
GET    /api/menu                  # Hämta publik meny
GET    /api/categories            # Hämta kategorier
POST   /api/reservations          # Skapa reservation
```

### Skyddade Endpoints

Kräver JWT-token i Authorization header (`Bearer <token>`):

#### Autentisering

```http
POST   /api/auth/login            # Logga in
POST   /api/auth/register         # Registrera användare (admin only)
GET    /api/auth/profile          # Hämta profil
POST   /api/auth/verify           # Verifiera token
```

#### Menyhantering

```http
GET    /api/menu/all              # Hämta all meny (inkl. inaktiva)
POST   /api/menu                  # Skapa menyrätt
PUT    /api/menu/:id              # Uppdatera menyrätt
DELETE /api/menu/:id              # Ta bort menyrätt
```

#### Kategorier

```http
POST   /api/categories            # Skapa kategori
PUT    /api/categories/:id        # Uppdatera kategori
DELETE /api/categories/:id        # Ta bort kategori
```

#### Reservationer

```http
GET    /api/reservations          # Hämta alla reservationer
PUT    /api/reservations/:id/status # Uppdatera status
DELETE /api/reservations/:id      # Ta bort reservation
```

## 🗄 Databasschema

### Tabellstruktur

#### `users`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
username TEXT UNIQUE NOT NULL
email TEXT UNIQUE NOT NULL
password TEXT NOT NULL (bcrypt-hashad)
role TEXT DEFAULT 'admin'
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `categories`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT UNIQUE NOT NULL
description TEXT
sort_order INTEGER DEFAULT 0
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `menu_items`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL
description TEXT
price DECIMAL(10,2) NOT NULL
category_id INTEGER (FK -> categories.id)
image_url TEXT
is_available BOOLEAN DEFAULT 1
allergens TEXT
sort_order INTEGER DEFAULT 0
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `reservations`

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
customer_name TEXT NOT NULL
customer_email TEXT NOT NULL
customer_phone TEXT NOT NULL
reservation_date DATE NOT NULL
reservation_time TIME NOT NULL
party_size INTEGER NOT NULL
special_requests TEXT
status TEXT DEFAULT 'pending' ('pending'|'confirmed'|'cancelled')
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Relationer

- `categories` → `menu_items` (1:många)
- Unique constraint på `(name, category_id)` i menu_items

## 🔒 Säkerhet

- **JWT Authentication** - 24h token-livslängd
- **bcrypt** - Lösenordshashing med salt rounds 10
- **CORS** - Konfigurerad för specifika domäner
- **Input Validation** - Validering på alla endpoints
- **SQL Injection Protection** - Prepared statements
- **Environment Variables** - Känslig data i miljövariabler

### CORS-konfiguration

```javascript
origin: [
  "http://localhost:8080",
  "http://localhost:3001",
  "https://bella-vista-frontend-hawi2401.netlify.app",
  "https://bella-vista-hawi2401.netlify.app/admin",
];
```

## 📁 Projektstruktur

```
bella-vista-backend/
├── config/
│   └── database.js          # Databaskonfiguration och initiering
├── docs/
│   ├── database-schema.md   # Databasschema dokumentation
│   └── system-architecture.md # Systemarkitektur
├── middleware/
│   └── auth.js              # JWT autentisering middleware
├── routes/
│   ├── auth.js              # Autentiseringsroutes
│   ├── categories.js        # Kategori-endpoints
│   ├── menu.js              # Meny-endpoints
│   └── reservations.js      # Reservations-endpoints
├── database/
│   └── bella_vista.db       # SQLite-databas (lokal utveckling)
├── server.js                # Huvudserverfil
├── package.json             # Dependencies och scripts
└── README.md                # Denna fil
```

### Databasinitiering

Databasen initieras automatiskt vid första start med:

- Admin-användare (admin/admin123)
- Standardkategorier (Antipasti, Primi Piatti, Secondi Piatti, Dolci)
- Exempel-meny med italienska rätter
