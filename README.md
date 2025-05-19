# Fahrspur 24 - Fahrschulverwaltungssystem

## Projektübersicht
Fahrspur 24 ist ein modernes Fahrschulverwaltungssystem, das Fahrlehrern und Fahrschülern eine effiziente Terminverwaltung und Kommunikation ermöglicht. Das System bietet eine intuitive Benutzeroberfläche und robuste Backend-Funktionalitäten für die Verwaltung von Fahrschulbetrieben.

## Technische Dokumentation

### Systemarchitektur
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js mit Express
- Datenbank: PostgreSQL
- Authentifizierung: JWT (JSON Web Tokens)
- Sicherheit: bcrypt für Passwort-Hashing
- Umgebungsvariablen: dotenv für Konfigurationsmanagement

### Verzeichnisstruktur
```
fahrschule/
├── docs/                    # Frontend-Dateien
│   ├── index.html          # Login-Seite
│   ├── dashboard.html      # Fahrschüler-Dashboard
│   ├── admin-dashboard.html # Fahrlehrer-Dashboard
│   ├── assets/            # Statische Assets
│   └── pages/             # Weitere Frontend-Seiten
├── backend/               # Backend-Code
│   ├── index.js          # Hauptanwendung
│   ├── db.js             # Datenbank-Konfiguration
│   └── routes/           # API-Routen
├── package.json          # Projekt-Konfiguration
├── package-lock.json     # Abhängigkeits-Lockfile
└── README.md             # Diese Dokumentation
```

### Abhängigkeiten
- express: ^4.18.2 - Web-Framework
- bcrypt: ^5.1.1 - Passwort-Hashing
- cors: ^2.8.5 - Cross-Origin Resource Sharing
- dotenv: ^16.5.0 - Umgebungsvariablen-Management
- jsonwebtoken: ^9.0.2 - JWT-Authentifizierung
- pg: ^8.11.3 - PostgreSQL Client

### Frontend-Komponenten

#### Dashboard
- Implementiert in `dashboard.html`
- Benutzerfreundliche Oberfläche für Fahrschüler
- Terminübersicht und -verwaltung
- Kommunikationsfunktionen
- Responsive Design für mobile Nutzung

#### Admin-Dashboard
- Implementiert in `admin-dashboard.html`
- Erweiterte Funktionen für Fahrlehrer
- Benutzerverwaltung
- Terminplanung und -verwaltung
- Statistiken und Berichte

### Backend-Funktionalitäten

#### Authentifizierung
- JWT-basierte Authentifizierung
- Sichere Passwort-Hashing mit bcrypt
- Benutzerrollen (Fahrschüler/Fahrlehrer)
- Session-Management

#### Datenbank
- PostgreSQL für Produktionsumgebung
- Benutzer- und Terminverwaltung
- Optimierte Datenbankabfragen
- Datenbank-Migrations-System

### Design-System

#### Farbpalette
- Primärfarbe: #2196F3 (Blau)
- Hintergrund: #212121 (Dunkelgrau)
- Container: #303030 (Mittelgrau)
- Text: #F3F3F3 (Weiß)
- Sekundärtext: #BDBDBD (Hellgrau)
- Akzentfarbe: #FF4081 (Pink)

#### Typografie
- Schriftart: Roboto
- Überschriften: 700 (Bold)
- Normaltext: 400 (Regular)
- Buttons: 500 (Medium)
- Responsive Schriftgrößen

### Installation und Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/silas-270/fahrschule
cd fahrschule
```

2. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env
# Bearbeiten Sie die .env-Datei mit Ihren Konfigurationen
```

3. Abhängigkeiten installieren:
```bash
npm install
```

4. Entwicklungsserver starten:
```bash
npm start
```

### Sicherheitshinweise
1. **Datenschutz**
   - Regelmäßige Überprüfung der Datenschutzerklärung
   - Aktualisierung bei neuen Datenschutzrichtlinien
   - Dokumentation von Datenverarbeitungsprozessen
   - DSGVO-Konformität

2. **Authentifizierung**
   - Sichere Passwort-Hashing mit bcrypt
   - JWT-basierte Session-Verwaltung
   - CORS-Konfiguration für API-Sicherheit
   - Rate Limiting für API-Endpunkte

3. **Datenbank**
   - Regelmäßige Backups
   - Verschlüsselte Verbindungen
   - SQL-Injection-Schutz

### Deployment
1. Frontend-Änderungen:
   ```bash
   # Dateien in docs/ aktualisieren
   git add docs/
   git commit -m "Update frontend files"
   git push
   ```

2. Backend-Änderungen:
   ```bash
   # Server-Code aktualisieren
   git add backend/
   git commit -m "Update backend code"
   git push
   ```