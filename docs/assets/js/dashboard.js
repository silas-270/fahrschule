import { appointmentService } from './services/appointmentService.js';
import { formatDateForDisplay, formatTimeForDisplay, isSameDay } from './utils/timezone.js';

// Globale Variablen
let currentWeekOffset = 0;
const API_BASE_URL = CONFIG.API_URL;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten in Millisekunden
let currentWeekData = null;

// Funktion zum Überprüfen der Session
function checkSession() {
    const session = localStorage.getItem('session');
    if (!session) {
        logout();
        return false;
    }

    try {
        const sessionData = JSON.parse(session);
        if (!sessionData.token) {
            logout();
            return false;
        }

        const now = Date.now();
        const lastActivity = sessionData.timestamp || 0;

        if (now - lastActivity > SESSION_TIMEOUT) {
            logout();
            return false;
        }

        sessionData.timestamp = now;
        localStorage.setItem('session', JSON.stringify(sessionData));
        return true;
    } catch (error) {
        console.error('Session error:', error);
        logout();
        return false;
    }
}

// Event-Listener für Benutzeraktivität
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
activityEvents.forEach(event => {
    document.addEventListener(event, () => {
        const session = localStorage.getItem('session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                sessionData.timestamp = Date.now();
                localStorage.setItem('session', JSON.stringify(sessionData));
            } catch (error) {
                console.error('Error updating activity timestamp:', error);
            }
        }
    });
});

// Session-Überprüfung beim Laden der Seite
window.addEventListener('load', () => {
    if (!checkSession()) return;
    
    setInterval(checkSession, 60000);
    
    try {
        const sessionData = JSON.parse(localStorage.getItem('session'));
        if (!sessionData.token) {
            logout();
            return;
        }
        
        document.getElementById('username').textContent = sessionData.username;
        initializeCalendar();
    } catch (error) {
        console.error('Session initialization error:', error);
        logout();
    }
});

// Mache die logout Funktion global verfügbar
window.logout = function() {
    localStorage.removeItem('session');
    window.location.href = 'index.html';
};

function formatDate(date) {
    // Convert to UTC for API calls
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

// Funktion zum Abrufen der Termine vom Backend
async function fetchAppointments(startDate, endDate) {
    try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.token) {
            throw new Error('Keine gültige Session gefunden');
        }

        // Setze die Endzeit auf 23:59:59 des Enddatums
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);

        // Erstelle die URL mit den korrekten Parameter-Namen
        const url = new URL(`${API_BASE_URL}/appointments`);
        url.searchParams.append('start_date', startDate.toISOString());
        url.searchParams.append('end_date', endDateTime.toISOString());

        console.log('Fetching appointments from:', url.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch appointments: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data.appointments;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        showNotification('Fehler beim Laden der Termine', 'error');
        return [];
    }
}

function updateWeekTitle(startDate, endDate) {
    const weekTitle = document.getElementById('weekTitle');
    if (weekTitle) {
        weekTitle.textContent = `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
    }
}

function changeWeek(offset) {
    currentWeekOffset += offset;
    currentWeekData = null; // Setze den Cache zurück bei Wochenwechsel
    initializeCalendar();
}

function initializeCalendar() {
    const appointmentsContainer = document.getElementById('appointments');
    
    // Berechne das Startdatum der aktuellen Woche
    const today = new Date();
    const startDate = new Date(today);
    
    // Berechne den Tag der Woche (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)
    const day = today.getDay();
    
    // Berechne die Differenz zum Montag
    // Wenn Sonntag (0), dann -6 Tage, sonst 1 - day
    const diff = day === 0 ? -6 : 1 - day;
    
    // Setze das Startdatum auf Montag
    startDate.setDate(today.getDate() + diff + (currentWeekOffset * 7));
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7); // Setze auf den nächsten Montag
    endDate.setHours(0, 0, 0, 0);
    
    updateWeekTitle(startDate, endDate);

    // Lade immer neue Daten, wenn currentWeekData null ist
    if (!currentWeekData) {
        fetchAppointments(startDate, endDate).then(appointments => {
            currentWeekData = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                appointments
            };
            displayWeekAppointments(appointmentsContainer, startDate, appointments);
        });
    } else {
        // Verwende die gecachten Daten
        displayWeekAppointments(appointmentsContainer, startDate, currentWeekData.appointments);
    }
}

function displayWeekAppointments(container, startDate, appointments) {
    // Clear the entire container first
    container.innerHTML = '';

    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    // Create new day containers
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-container';
        
        const dayHeader = document.createElement('h3');
        dayHeader.textContent = `${days[date.getDay()]}, ${formatDateForDisplay(date)}`;
        dayContainer.appendChild(dayHeader);
        
        // Filtere Termine für diesen Tag
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            // Konvertiere das Termin-Datum in die lokale Zeitzone
            const localAptDate = new Date(aptDate.getTime());
            // Konvertiere das Vergleichsdatum in die lokale Zeitzone
            const localDate = new Date(date.getTime());
            
            // Vergleiche nur Jahr, Monat und Tag
            return localAptDate.getFullYear() === localDate.getFullYear() &&
                   localAptDate.getMonth() === localDate.getMonth() &&
                   localAptDate.getDate() === localDate.getDate();
        });

        dayAppointments.forEach(appointment => {
            const appointmentElement = createAppointmentElement(appointment);
            dayContainer.appendChild(appointmentElement);
        });

        container.appendChild(dayContainer);
    }
}

// Erstellt ein Termin-Element
function createAppointmentElement(appointment) {
    const element = document.createElement('div');
    element.className = `appointment ${appointment.status}`;
    
    const time = formatTimeForDisplay(new Date(appointment.date));
    
    const timeAndType = document.createElement('div');
    timeAndType.className = 'appointment-info';
    timeAndType.innerHTML = `<strong>${time}</strong> - ${appointment.type}`;
    element.appendChild(timeAndType);

    if (appointment.status === 'suggested') {
        const actions = document.createElement('div');
        actions.className = 'appointment-actions';
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'accept-button';
        acceptButton.textContent = 'Annehmen';
        acceptButton.onclick = () => handleAppointmentResponse(appointment.id, 'accept');
        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'reject-button';
        rejectButton.textContent = 'Ablehnen';
        rejectButton.onclick = () => handleAppointmentResponse(appointment.id, 'reject');
        
        actions.appendChild(acceptButton);
        actions.appendChild(rejectButton);
        element.appendChild(actions);
    }

    return element;
}

function getStatusText(status) {
    switch (status) {
        case 'suggested':
            return 'Vorgeschlagen';
        case 'accepted':
            return 'Angenommen';
        case 'rejected':
            return 'Abgelehnt';
        default:
            return status;
    }
}

async function handleAppointmentResponse(appointmentId, newStatus) {
    try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.token) {
            throw new Error('Keine gültige Session gefunden');
        }

        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/${newStatus}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error('Failed to update appointment status');
        }

        const statusMessage = newStatus === 'accept' ? 'angenommen' : 'abgelehnt';
        showNotification(`Termin ${statusMessage}`, 'success');
        
        // Setze den Cache zurück und aktualisiere die Ansicht
        currentWeekData = null;
        await initializeCalendar();
    } catch (error) {
        console.error('Error updating appointment:', error);
        showNotification('Fehler beim Aktualisieren des Termins', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event Listener für die Navigationsbuttons
document.getElementById('prevWeek').addEventListener('click', () => changeWeek(-1));
document.getElementById('nextWeek').addEventListener('click', () => changeWeek(1)); 