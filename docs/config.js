const config = {
    development: {
        backendUrl: 'http://localhost:3000'
    },
    production: {
        backendUrl: 'https://fahrschule-login-production.up.railway.app'
    }
};

// Automatische Umgebungserkennung
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const environment = isDevelopment ? 'development' : 'production';

// Exportiere die Konfiguration
window.APP_CONFIG = config[environment]; 