# Fahrschule Management System

## Migration zu einem anderen Host

### 1. Backend-Migration

1. **Datenbank-Migration**:
   ```bash
   # Export der Datenbank
   pg_dump -h [RAILWAY_DB_HOST] -U [RAILWAY_DB_USER] -d [RAILWAY_DB_NAME] > backup.sql
   
   # Import auf dem neuen Server
   psql -h [NEW_DB_HOST] -U [NEW_DB_USER] -d [NEW_DB_NAME] < backup.sql
   ```

2. **Backend-Konfiguration**:
   - Kopieren Sie den `backend`-Ordner auf den neuen Server
   - Setzen Sie die Umgebungsvariablen:
     ```
     DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DB_NAME]
     JWT_SECRET=[IHR_JWT_SECRET]
     JWT_REFRESH_SECRET=[IHR_REFRESH_SECRET]
     NODE_ENV=production
     PORT=3000
     ```

3. **Backend-Start**:
   ```bash
   cd backend
   npm install
   npm start
   ```

### 2. Frontend-Migration

1. **Konfiguration anpassen**:
   - Öffnen Sie `docs/config.js`
   - Ändern Sie `window.API_BASE_URL` auf die neue Backend-URL
   - Oder überschreiben Sie die URL in der `index.html`

2. **Deployment**:
   - Kopieren Sie den `docs`-Ordner auf Ihren Webserver
   - Stellen Sie sicher, dass der Webserver HTTPS unterstützt
   - Konfigurieren Sie die Domain und SSL-Zertifikate

### 3. DNS-Konfiguration

1. Aktualisieren Sie Ihre DNS-Einträge:
   - A-Record oder CNAME für Ihre Domain
   - SSL-Zertifikat einrichten (z.B. mit Let's Encrypt)

### 4. Sicherheitscheckliste

- [ ] SSL-Zertifikat installiert
- [ ] Firewall konfiguriert
- [ ] Regelmäßige Backups eingerichtet
- [ ] Monitoring eingerichtet
- [ ] Logging konfiguriert

### 5. Wartung

- Regelmäßige Updates der Abhängigkeiten
- Überwachung der Server-Ressourcen
- Backup-Verifizierung
- Sicherheitsaudits

## Entwicklung

### Lokale Entwicklung

1. Backend starten:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Frontend testen:
   - Öffnen Sie `docs/index.html` im Browser
   - Oder nutzen Sie einen lokalen Webserver

### Umgebungsvariablen

Erstellen Sie eine `.env`-Datei im Backend-Verzeichnis:
```
DATABASE_URL=postgresql://localhost:5432/fahrschule
JWT_SECRET=development_secret
JWT_REFRESH_SECRET=development_refresh_secret
NODE_ENV=development
PORT=3000
``` 