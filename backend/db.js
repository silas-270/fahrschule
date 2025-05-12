import pg from 'pg';
const { Pool } = pg;

// Erstelle einen Pool mit den Umgebungsvariablen von Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Teste die Datenbankverbindung
pool.on('error', (err) => {
    console.error('Unerwarteter Fehler bei der Datenbankverbindung:', err);
});

// Wrapper für die Datenbankoperationen
export async function openDb() {
    try {
        // Teste die Verbindung
        await pool.query('SELECT NOW()');
        console.log('Datenbankverbindung erfolgreich hergestellt');
    } catch (error) {
        console.error('Fehler bei der Datenbankverbindung:', error);
        throw new Error('Datenbankverbindung fehlgeschlagen: ' + error.message);
    }

    return {
        // Führt eine SQL-Abfrage aus und gibt alle Ergebnisse zurück
        all: async (sql, params = []) => {
            try {
                const result = await pool.query(sql, params);
                return result.rows;
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (all):', error);
                throw error;
            }
        },

        // Führt eine SQL-Abfrage aus und gibt das erste Ergebnis zurück
        get: async (sql, params = []) => {
            try {
                const result = await pool.query(sql, params);
                return result.rows[0];
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (get):', error);
                throw error;
            }
        },

        // Führt eine SQL-Abfrage aus und gibt das Ergebnis zurück
        run: async (sql, params = []) => {
            try {
                const result = await pool.query(sql, params);
                return {
                    changes: result.rowCount,
                    lastID: result.rows[0]?.id
                };
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (run):', error);
                throw error;
            }
        },

        // Führt eine SQL-Abfrage aus
        exec: async (sql) => {
            try {
                await pool.query(sql);
            } catch (error) {
                console.error('Fehler bei Datenbankabfrage (exec):', error);
                throw error;
            }
        }
    };
}