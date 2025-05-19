# Fahrspur 24 - Fahrschulverwaltungssystem

## Projektübersicht
Fahrspur 24 ist ein modernes Fahrschulverwaltungssystem, das Fahrlehrern und Fahrschülern eine effiziente Terminverwaltung und Kommunikation ermöglicht.

## Technische Dokumentation

### Systemarchitektur
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js mit Express
- Datenbank: PostgreSQL
- Hosting: Railway.app

### Verzeichnisstruktur
```
fahrschule/
├── docs/                    # Frontend-Dateien
│   ├── index.html          # Login-Seite
│   ├── dashboard.html      # Fahrschüler-Dashboard
│   ├── admin-dashboard.html # Fahrlehrer-Dashboard
│   ├── impressum.html      # Impressum
│   ├── datenschutz.html    # Datenschutzerklärung
│   ├── cookie-banner.js    # Cookie-Banner Funktionalität
│   └── dashboard.js        # Dashboard Funktionalität
├── server/                 # Backend-Code
│   ├── index.js           # Hauptanwendung
│   ├── routes/            # API-Routen
│   ├── models/            # Datenbankmodelle
│   └── middleware/        # Middleware-Funktionen
└── README.md              # Diese Dokumentation
```

### Frontend-Komponenten

#### Cookie-Banner
- Implementiert in `cookie-banner.js`
- Erscheint beim ersten Besuch der Website
- Speichert Zustimmung im localStorage
- Verlinkt zur Datenschutzerklärung

#### Rechtliche Seiten
1. **Impressum** (`impressum.html`)
   - Pflichtangaben gemäß § 5 TMG
   - Kontaktdaten
   - Verantwortlichkeiten
   - Haftungsausschlüsse

2. **Datenschutzerklärung** (`datenschutz.html`)
   - DSGVO-konforme Datenschutzerklärung
   - Cookie-Informationen
   - Nutzerrechte
   - Kontaktdaten

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

#### Komponenten
1. **Buttons**
   - Primär: Blau (#2196F3)
   - Sekundär: Grau (#424242)
   - Gefahr: Rot (#F44336)

2. **Container**
   - Abgerundete Ecken (8px/16px)
   - Schatten-Effekt
   - Padding: 1rem/1.5rem

3. **Formulare**
   - Einheitliche Input-Styles
   - Validierungs-Feedback
   - Responsive Layout

### Wartung und Updates

#### Cookie-Banner
1. Banner anpassen:
   - Text in `cookie-banner.js` bearbeiten
   - Styling in der jeweiligen HTML-Datei anpassen

2. Datenschutzerklärung aktualisieren:
   - `datenschutz.html` bearbeiten
   - Neue Datenschutzrichtlinien einarbeiten

#### Rechtliche Seiten
1. Impressum aktualisieren:
   - Kontaktdaten in `impressum.html` aktualisieren
   - Rechtliche Texte bei Bedarf anpassen

2. Datenschutzerklärung aktualisieren:
   - Neue Datenschutzrichtlinien in `datenschutz.html` einarbeiten
   - Cookie-Informationen aktualisieren

### Sicherheitshinweise
1. **Datenschutz**
   - Regelmäßige Überprüfung der Datenschutzerklärung
   - Aktualisierung bei neuen Datenschutzrichtlinien
   - Dokumentation von Datenverarbeitungsprozessen

2. **Cookies**
   - Nur technisch notwendige Cookies verwenden
   - Cookie-Consent dokumentieren
   - Regelmäßige Überprüfung der Cookie-Verwendung

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
   git add server/
   git commit -m "Update backend code"
   git push
   ```

### Kontakt
Bei technischen Fragen oder Problemen:
- E-Mail: [E-Mail-Adresse]
- Telefon: [Telefonnummer]
- Support-Zeiten: Mo-Fr, 9:00-17:00 Uhr 