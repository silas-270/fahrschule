import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Öffne (oder erstelle) SQLite-Datenbank
export async function openDb() {
  return open({
    filename: './backend/users.db',
    driver: sqlite3.Database
  });
}