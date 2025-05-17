// Globale Variablen
let currentWeekOffset = 0;
const API_BASE_URL = 'https://fahrschule-production.up.railway.app';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten in Millisekunden

// Funktion zum Überprüfen der Session
function checkSession() {
    const session = localStorage.getItem('session');
    if (!session) {
        logout();
        return;
    }

    try {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        const lastActivity = sessionData.lastActivity || 0;

        if (now - lastActivity > SESSION_TIMEOUT) {
            console.log('Session timeout - logging out');
            logout();
            return;
        }

        // Aktualisiere den Zeitstempel der letzten Aktivität
        sessionData.lastActivity = now;
        localStorage.setItem('session', JSON.stringify(sessionData));
    } catch (error) {
        console.error('Session error:', error);
        logout();
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
                sessionData.lastActivity = Date.now();
                localStorage.setItem('session', JSON.stringify(sessionData));
            } catch (error) {
                console.error('Error updating activity timestamp:', error);
            }
        }
    });
});

// Session-Überprüfung beim Laden der Seite
window.addEventListener('load', () => {
    checkSession();
    // Überprüfe die Session alle Minute
    setInterval(checkSession, 60000);
    
    const session = localStorage.getItem('session');
    console.log('Loaded session:', session); // Debug output
    
    if (!session) {
        console.log('No session found, redirecting to login'); // Debug output
        window.location.href = 'index.html';
        return;
    }

    try {
        const sessionData = JSON.parse(session);
        console.log('Parsed session data:', sessionData); // Debug output
        
        if (!sessionData.token) {
            console.log('No token in session data, redirecting to login'); // Debug output
            logout();
            return;
        }
        
        document.getElementById('username').textContent = sessionData.username;
        initializeCalendar();
    } catch (error) {
        console.error('Session error:', error);
        logout();
    }
});

function logout() {
    console.log('Logging out, clearing session'); // Debug output
    localStorage.removeItem('session');
    window.location.href = 'index.html';
}

function formatDate(date) {
    // Convert to UTC for API calls
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

function formatDateForDisplay(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
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
        weekTitle.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
}

function changeWeek(offset) {
    currentWeekOffset += offset;
    initializeCalendar();
}

// Globale Variable für die aktuelle Woche
let currentWeekData = null;

function initializeCalendar() {
    const appointmentsContainer = document.getElementById('appointments');
    
    // Berechne das Startdatum der aktuellen Woche
    const today = new Date();
    const startDate = new Date(today);
    // Setze auf Montag der aktuellen Woche
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Wenn Sonntag, dann -6 Tage, sonst 1 - dayOfWeek
    startDate.setDate(today.getDate() + diff + (currentWeekOffset * 7));
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    updateWeekTitle(startDate, endDate);

    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    // Nur Abfragen, wenn sich die Woche geändert hat
    const weekKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
    if (currentWeekData?.weekKey === weekKey) {
        // Verwende die bereits geladenen Daten
        displayWeekAppointments(appointmentsContainer, startDate, currentWeekData.appointments);
    } else {
        // Lade neue Daten
        fetchAppointments(startDate, endDate).then(appointments => {
            currentWeekData = {
                weekKey,
                appointments
            };
            displayWeekAppointments(appointmentsContainer, startDate, appointments);
        });
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
        
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            // Konvertiere beide Daten in die lokale Zeitzone für den Vergleich
            const aptDateLocal = new Date(aptDate.getTime() - aptDate.getTimezoneOffset() * 60000);
            const compareDateLocal = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return aptDateLocal.toDateString() === compareDateLocal.toDateString();
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
    
    // Konvertiere das Datum in die lokale Zeitzone
    const aptDate = new Date(appointment.date);
    const localDate = new Date(aptDate.getTime() - aptDate.getTimezoneOffset() * 60000);
    
    const time = localDate.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
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
        initializeCalendar(); // Aktualisiere die Ansicht
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