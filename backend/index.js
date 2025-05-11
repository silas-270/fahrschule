import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { openDb } from './db.js';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// init DB + Testuser
(async () => {
  const db = await openDb();
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  const testUser = await db.get('SELECT * FROM users WHERE username = ?', ['test']);
  if (!testUser) {
    const hash = await bcrypt.hash('passwort123', 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['test', hash]);
    console.log('Testnutzer erstellt: test / passwort123');
  }
})();

// Login-Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) return res.status(401).json({ success: false, message: 'Login fehlgeschlagen' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Login fehlgeschlagen' });

  return res.json({ success: true, message: 'Login erfolgreich' });
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});