import pg from 'pg';
const { Pool } = pg;

// Debug: Zeige die Datenbank-URL (ohne Passwort)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL ist nicht gesetzt! Bitte überprüfen Sie die Railway-Konfiguration.');
    process.exit(1);
}

// Erstelle einen Pool mit den Umgebungsvariablen von Railway
const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    },
    // Verbindungsoptionen
    connectionTimeoutMillis: 5000, // 5 Sekunden Timeout
    idleTimeoutMillis: 30000, // 30 Sekunden
    max: 20 // Maximale Anzahl der Verbindungen im Pool
});

// Teste die Datenbankverbindung
pool.on('error', (err) => {
    console.error('Unerwarteter Fehler bei der Datenbankverbindung:', err);
    // Versuche die Verbindung neu aufzubauen
    setTimeout(() => {
        console.log('Versuche Datenbankverbindung neu aufzubauen...');
        pool.connect().catch(err => {
            console.error('Fehler beim Neuaufbau der Verbindung:', err);
        });
    }, 5000);
});

// Wrapper für die Datenbankoperationen
export async function openDb() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log(`Versuche Datenbankverbindung herzustellen... (${retries} Versuche übrig)`);
            const client = await pool.connect();
            try {
                // Teste die Verbindung
                await client.query('SELECT NOW()');
                console.log('Datenbankverbindung erfolgreich hergestellt');
                
                // Erstelle die users-Tabelle, falls sie nicht existiert
                await client.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP,
                        failed_attempts INTEGER DEFAULT 0
                    );
                `);
                console.log('Users-Tabelle wurde erfolgreich erstellt oder existiert bereits');
                
                client.release();
                break;
            } catch (err) {
                client.release();
                throw err;
            }
        } catch (error) {
            console.error('Fehler bei der Datenbankverbindung:', error);
            retries--;
            if (retries === 0) {
                console.error('Keine Verbindung zur Datenbank möglich. Bitte überprüfen Sie:');
                console.error('1. Ist die DATABASE_URL korrekt gesetzt?');
                console.error('2. Ist die PostgreSQL-Datenbank in Railway aktiv?');
                console.error('3. Sind die Netzwerkeinstellungen korrekt?');
                throw new Error('Datenbankverbindung fehlgeschlagen: ' + error.message);
            }
            // Warte 5 Sekunden vor dem nächsten Versuch
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    return {
        // Führt eine SQL-Abfrage aus und gibt alle Ergebnisse zurück
        all: async (sql, params = []) => {
            const client = await pool.connect();
            try {
                const result = await client.query(sql, params);
                return result.rows;
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (all):', error);
                throw error;
            } finally {
                client.release();
            }
        },

        // Führt eine SQL-Abfrage aus und gibt das erste Ergebnis zurück
        get: async (sql, params = []) => {
            const client = await pool.connect();
            try {
                const result = await client.query(sql, params);
                return result.rows[0];
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (get):', error);
                throw error;
            } finally {
                client.release();
            }
        },

        // Führt eine SQL-Abfrage aus und gibt das Ergebnis zurück
        run: async (sql, params = []) => {
            const client = await pool.connect();
            try {
                const result = await client.query(sql, params);
                return {
                    changes: result.rowCount,
                    lastID: result.rows[0]?.id
                };
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (run):', error);
                throw error;
            } finally {
                client.release();
            }
        },

        // Führt eine SQL-Abfrage aus
        exec: async (sql) => {
            const client = await pool.connect();
            try {
                await client.query(sql);
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (exec):', error);
                throw error;
            } finally {
                client.release();
            }
        }
    };
}