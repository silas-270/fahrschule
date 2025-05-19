// Cache-Konfiguration
const CACHE_CONFIG = {
    maxAge: 5 * 60 * 1000, // 5 Minuten
    cleanupInterval: 60 * 1000 // 1 Minute
};

class AppointmentCache {
    constructor() {
        this.cache = new Map();
        this.startCleanupInterval();
    }

    // Fügt einen Eintrag zum Cache hinzu
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Holt einen Eintrag aus dem Cache
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > CACHE_CONFIG.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    // Löscht einen Eintrag aus dem Cache
    delete(key) {
        this.cache.delete(key);
    }

    // Löscht alle abgelaufenen Einträge
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > CACHE_CONFIG.maxAge) {
                this.cache.delete(key);
            }
        }
    }

    // Startet den Cleanup-Interval
    startCleanupInterval() {
        setInterval(() => this.cleanup(), CACHE_CONFIG.cleanupInterval);
    }

    // Löscht den gesamten Cache
    clear() {
        this.cache.clear();
    }
}

// Singleton-Instanz
const appointmentCache = new AppointmentCache();

export { appointmentCache }; 