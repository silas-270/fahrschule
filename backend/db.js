import pg from 'pg';
const { Pool } = pg;

// Erstelle einen Pool mit den Umgebungsvariablen von Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Wrapper für die Datenbankoperationen
export async function openDb() {
    return {
        // Führt eine SQL-Abfrage aus und gibt alle Ergebnisse zurück
        all: async (sql, params = []) => {
            const result = await pool.query(sql, params);
            return result.rows;
        },

        // Führt eine SQL-Abfrage aus und gibt das erste Ergebnis zurück
        get: async (sql, params = []) => {
            const result = await pool.query(sql, params);
            return result.rows[0];
        },

        // Führt eine SQL-Abfrage aus und gibt das Ergebnis zurück
        run: async (sql, params = []) => {
            const result = await pool.query(sql, params);
            return {
                changes: result.rowCount,
                lastID: result.rows[0]?.id
            };
        },

        // Führt eine SQL-Abfrage aus
        exec: async (sql) => {
            await pool.query(sql);
        }
    };
}