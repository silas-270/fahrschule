# Fahrspur 24 - Fahrschulverwaltungssystem

## Projektübersicht
Fahrspur 24 ist ein modernes Fahrschulverwaltungssystem, das Fahrlehrern und Fahrschülern eine effiziente Terminverwaltung und Kommunikation ermöglicht.

## Technische Dokumentation

### Systemarchitektur
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js mit Express
- Datenbank: PostgreSQL
- Authentifizierung: JWT (JSON Web Tokens)
- Sicherheit: bcrypt für Passwort-Hashing

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
│   └── users.db          # SQLite Datenbank (Entwicklung)
└── README.md             # Diese Dokumentation
```

### Abhängigkeiten
- express: ^4.18.2
- bcrypt: ^5.1.1
- cors: ^2.8.5
- jsonwebtoken: ^9.0.2
- pg: ^8.11.3

### Frontend-Komponenten

#### Dashboard
- Implementiert in `dashboard.html`
- Benutzerfreundliche Oberfläche für Fahrschüler
- Terminübersicht und -verwaltung
- Kommunikationsfunktionen

#### Admin-Dashboard
- Implementiert in `admin-dashboard.html`
- Erweiterte Funktionen für Fahrlehrer
- Benutzerverwaltung
- Terminplanung und -verwaltung

### Backend-Funktionalitäten

#### Authentifizierung
- JWT-basierte Authentifizierung
- Sichere Passwort-Hashing mit bcrypt
- Benutzerrollen (Fahrschüler/Fahrlehrer)

#### Datenbank
- PostgreSQL für Produktionsumgebung
- SQLite für Entwicklungsumgebung
- Benutzer- und Terminverwaltung

### Design-System

#### Farbpalette
- Primärfarbe: #2196F3 (Blau)
- Hintergrund: #212121 (Dunkelgrau)
- Container: #303030 (Mittelgrau)
- Text: #F3F3F3 (Weiß)
- Sekundärtext: #BDBDBD (Hellgrau)

#### Typografie
- Schriftart: Roboto
- Überschriften: 700 (Bold)
- Normaltext: 400 (Regular)
- Buttons: 500 (Medium)

### Installation und Entwicklung

1. Repository klonen:
```bash
git clone [repository-url]
cd fahrschule
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm start
```

### Sicherheitshinweise
1. **Datenschutz**
   - Regelmäßige Überprüfung der Datenschutzerklärung
   - Aktualisierung bei neuen Datenschutzrichtlinien
   - Dokumentation von Datenverarbeitungsprozessen

2. **Authentifizierung**
   - Sichere Passwort-Hashing mit bcrypt
   - JWT-basierte Session-Verwaltung
   - CORS-Konfiguration für API-Sicherheit

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

### Kontakt
Bei technischen Fragen oder Problemen:
- E-Mail: [E-Mail-Adresse]
- Telefon: [Telefonnummer]
- Support-Zeiten: Mo-Fr, 9:00-17:00 Uhr 