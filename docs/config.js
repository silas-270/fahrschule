// Frontend Konfiguration
window.API_BASE_URL = 'https://fahrschule-backend.up.railway.app'; // Kann in der index.html überschrieben werden

// Weitere Konfigurationsoptionen können hier hinzugefügt werden
window.APP_CONFIG = {
    sessionTimeout: 30 * 60 * 1000, // 30 Minuten
    maxFailedAttempts: 5,
    refreshTokenInterval: 14 * 60 * 1000, // 14 Minuten
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm'
}; 