import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Öffnet die Datenbank mit sqlite3 als Treiber
export async function openDb() {
  return open({
    filename: './backend/users.db',
    driver: sqlite3.Database
  });
}