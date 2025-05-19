// Zeitzonen-Konfiguration
const TIMEZONE_CONFIG = {
    defaultTimezone: 'Europe/Berlin',
    formatOptions: {
        timeZone: 'Europe/Berlin',
        hour12: false
    }
};

// Konvertiert ein Datum in die lokale Zeitzone
function convertToLocalTime(date) {
    return new Date(date.toLocaleString('en-US', TIMEZONE_CONFIG.formatOptions));
}

// Formatiert ein Datum für die API (ISO String)
function formatDateForAPI(date) {
    return date.toISOString();
}

// Formatiert ein Datum für die Anzeige
function formatDateForDisplay(date) {
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formatiert eine Zeit für die Anzeige
function formatTimeForDisplay(date) {
    return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Vergleicht zwei Daten auf Gleichheit (nur Datum, nicht Zeit)
function isSameDay(date1, date2) {
    // Konvertiere beide Daten in das lokale Datum
    const localDate1 = new Date(date1.getTime() - date1.getTimezoneOffset() * 60000);
    const localDate2 = new Date(date2.getTime() - date2.getTimezoneOffset() * 60000);
    
    return localDate1.getFullYear() === localDate2.getFullYear() &&
           localDate1.getMonth() === localDate2.getMonth() &&
           localDate1.getDate() === localDate2.getDate();
}

// Exportiere alle Funktionen
export {
    TIMEZONE_CONFIG,
    convertToLocalTime,
    formatDateForAPI,
    formatDateForDisplay,
    formatTimeForDisplay,
    isSameDay
}; 