import { appointmentCache } from '../utils/cache.js';
import { formatDateForAPI, convertToLocalTime, isSameDay } from '../utils/timezone.js';

class AppointmentService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    // Hilfsfunktion für API-Anfragen
    async request(endpoint, method = 'GET', body = null, isAdmin = false) {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.token) {
            throw new Error('Nicht autorisiert');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
        };

        if (isAdmin && session.adminToken) {
            headers['admin-token'] = session.adminToken;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.apiUrl}${endpoint}`, options);
        if (!response.ok) {
            throw new Error('Anfrage fehlgeschlagen');
        }

        return await response.json();
    }

    // Lädt Termine für einen Zeitraum
    async getAppointments(startDate, endDate, isAdmin = false) {
        const cacheKey = `appointments_${startDate.toISOString()}_${endDate.toISOString()}_${isAdmin}`;
        const cachedData = appointmentCache.get(cacheKey);
        
        if (cachedData) {
            return cachedData;
        }

        const params = new URLSearchParams({
            start_date: formatDateForAPI(startDate),
            end_date: formatDateForAPI(endDate)
        });

        const endpoint = isAdmin ? '/admin/appointments' : '/appointments';
        const response = await this.request(`${endpoint}?${params.toString()}`, 'GET', null, isAdmin);
        
        appointmentCache.set(cacheKey, response.appointments);
        return response.appointments;
    }

    // Erstellt einen neuen Termin
    async createAppointment(appointmentData, isAdmin = false) {
        const response = await this.request(
            '/appointments',
            'POST',
            appointmentData,
            isAdmin
        );

        // Cache invalidieren
        appointmentCache.clear();
        return response;
    }

    // Aktualisiert einen Termin
    async updateAppointment(appointmentId, appointmentData, isAdmin = false) {
        const response = await this.request(
            `/appointments/${appointmentId}`,
            'PUT',
            appointmentData,
            isAdmin
        );

        // Cache invalidieren
        appointmentCache.clear();
        return response;
    }

    // Löscht einen Termin
    async deleteAppointment(appointmentId, isAdmin = false) {
        await this.request(
            `/appointments/${appointmentId}`,
            'DELETE',
            null,
            isAdmin
        );

        // Cache invalidieren
        appointmentCache.clear();
    }

    // Aktualisiert den Status eines Termins
    async updateAppointmentStatus(appointmentId, status) {
        const response = await this.request(
            `/appointments/${appointmentId}/${status}`,
            'PUT',
            { status }
        );

        // Cache invalidieren
        appointmentCache.clear();
        return response;
    }
}

// Singleton-Instanz
const appointmentService = new AppointmentService(CONFIG.API_URL);

export { appointmentService }; 