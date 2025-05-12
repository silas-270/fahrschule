import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { openDb } from './db.js';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Überprüfe, ob ADMIN_TOKEN gesetzt ist
if (!ADMIN_TOKEN) {
    console.error('WARNUNG: ADMIN_TOKEN ist nicht in den Umgebungsvariablen gesetzt!');
    console.error('Bitte setzen Sie den ADMIN_TOKEN in Railway unter Variables.');
    console.error('Die Admin-Routen werden ohne Token nicht funktionieren.');
}

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Fehler:', err);
    res.status(500).json({
        success: false,
        message: 'Ein interner Fehler ist aufgetreten',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Middleware für Rate Limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 Minuten
const MAX_REQUESTS = 100;

app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, timestamp: now });
    } else {
        const data = rateLimit.get(ip);
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
            rateLimit.set(ip, { count: 1, timestamp: now });
        } else if (data.count >= MAX_REQUESTS) {
            return res.status(429).json({ 
                success: false, 
                message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' 
            });
        } else {
            data.count++;
        }
    }
    next();
});

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Middleware für Admin-Authentifizierung
const adminAuth = (req, res, next) => {
    const token = req.headers['admin-token'];
    
    if (!ADMIN_TOKEN) {
        console.error('ADMIN_TOKEN ist nicht in den Umgebungsvariablen gesetzt!');
        return res.status(500).json({
            success: false,
            message: 'Server-Konfigurationsfehler: ADMIN_TOKEN nicht gesetzt'
        });
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Admin-Token fehlt im Header'
        });
    }
    
    // Trimme beide Tokens und vergleiche sie
    const trimmedToken = token.trim();
    const trimmedAdminToken = ADMIN_TOKEN.trim();
    
    if (trimmedToken !== trimmedAdminToken) {
        return res.status(401).json({
            success: false,
            message: 'Ungültiger Admin-Token'
        });
    }
    
    next();
};

// init DB
(async () => {
    try {
        console.log('Initialisiere Datenbank...');
        const db = await openDb();
        await db.exec(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            failed_attempts INTEGER DEFAULT 0
        )`);

        // Testuser nur erstellen, wenn keine Benutzer existieren
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            const hash = await bcrypt.hash('passwort123', 12);
            await db.run('INSERT INTO users (username, password) VALUES ($1, $2)', ['test', hash]);
            console.log('Testnutzer erstellt: test / passwort123');
        }
        console.log('Datenbank-Initialisierung abgeschlossen');
    } catch (error) {
        console.error('Fehler bei der Datenbank-Initialisierung:', error);
        process.exit(1); // Beende den Prozess bei Datenbankfehlern
    }
})();

// Validierungsfunktionen
const validateUsername = (username) => {
    if (!username || username.length < 3 || username.length > 20) {
        return false;
    }
    return /^[a-zA-Z0-9_]+$/.test(username);
};

const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return false;
    }
    return true;
};

// Registrierungs-Route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!validateUsername(username)) {
            return res.status(400).json({
                success: false,
                message: 'Benutzername muss zwischen 3 und 20 Zeichen lang sein und darf nur Buchstaben, Zahlen und Unterstriche enthalten.'
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Passwort muss mindestens 8 Zeichen lang sein.'
            });
        }

        const db = await openDb();
        
        // Prüfen ob Benutzer bereits existiert
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Dieser Benutzername ist bereits vergeben.'
            });
        }

        const hash = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);

        res.status(201).json({
            success: true,
            message: 'Registrierung erfolgreich'
        });
    } catch (error) {
        console.error('Registrierungsfehler:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Login-Route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Benutzername und Passwort sind erforderlich'
            });
        }

        const db = await openDb();
        const user = await db.get('SELECT * FROM users WHERE username = $1', [username]);

        if (!user) {
            // Verzögerung bei fehlgeschlagenem Login
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({
                success: false,
                message: 'Ungültige Anmeldedaten'
            });
        }

        // Prüfe auf zu viele fehlgeschlagene Versuche
        if (user.failed_attempts >= 5) {
            const lastAttempt = new Date(user.last_login);
            const lockoutTime = 15 * 60 * 1000; // 15 Minuten
            if (Date.now() - lastAttempt < lockoutTime) {
                return res.status(429).json({
                    success: false,
                    message: 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es später erneut.'
                });
            }
            // Reset failed attempts after lockout period
            await db.run('UPDATE users SET failed_attempts = 0 WHERE id = $1', [user.id]);
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            // Erhöhe fehlgeschlagene Versuche
            await db.run('UPDATE users SET failed_attempts = failed_attempts + 1, last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
            return res.status(401).json({
                success: false,
                message: 'Ungültige Anmeldedaten'
            });
        }

        // Reset failed attempts and update last login on successful login
        await db.run('UPDATE users SET failed_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        res.json({
            success: true,
            message: 'Login erfolgreich',
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Admin-Routen
// Alle Benutzer auflisten
app.get('/admin/users', adminAuth, async (req, res) => {
    try {
        const db = await openDb();
        const users = await db.all('SELECT id, username, created_at, last_login FROM users');
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Neuen Benutzer erstellen
app.post('/admin/users', adminAuth, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Benutzername und Passwort sind erforderlich'
            });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Benutzername muss zwischen 3 und 20 Zeichen lang sein'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Passwort muss mindestens 8 Zeichen lang sein'
            });
        }

        const db = await openDb();
        
        // Prüfen ob Benutzer bereits existiert
        const existingUser = await db.get('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Dieser Benutzername ist bereits vergeben'
            });
        }

        const hash = await bcrypt.hash(password, 12);
        await db.run('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);

        res.status(201).json({
            success: true,
            message: 'Benutzer erfolgreich erstellt'
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Benutzers:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Benutzer löschen
app.delete('/admin/users/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await openDb();
        
        const result = await db.run('DELETE FROM users WHERE id = $1', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Benutzer nicht gefunden'
            });
        }

        res.json({
            success: true,
            message: 'Benutzer erfolgreich gelöscht'
        });
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Passwort zurücksetzen
app.post('/admin/users/:id/reset-password', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Neues Passwort muss mindestens 8 Zeichen lang sein'
            });
        }

        const db = await openDb();
        const hash = await bcrypt.hash(newPassword, 12);
        
        const result = await db.run(
            'UPDATE users SET password = $1, failed_attempts = 0 WHERE id = $2',
            [hash, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Benutzer nicht gefunden'
            });
        }

        res.json({
            success: true,
            message: 'Passwort erfolgreich zurückgesetzt'
        });
    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        res.status(500).json({
            success: false,
            message: 'Ein Fehler ist aufgetreten'
        });
    }
});

// Starte den Server
app.listen(PORT, () => {
    console.log(`Backend läuft auf Port ${PORT}`);
});