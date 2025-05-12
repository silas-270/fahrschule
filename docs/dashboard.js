// Globale Variablen
let currentWeekOffset = 0;
const API_BASE_URL = 'https://fahrschule-production.up.railway.app';

// Session-Überprüfung beim Laden der Seite
window.addEventListener('load', () => {
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
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

// Funktion zum Abrufen der Termine vom Backend
async function fetchAppointments(startDate, endDate) {
    try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.token) {
            throw new Error('Keine gültige Session gefunden');
        }

        const url = `${API_BASE_URL}/appointments?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
        console.log('Fetching appointments from:', url); // Debug output

        const headers = {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        console.log('Request headers:', headers); // Debug output

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            mode: 'cors'
        });

        console.log('Response status:', response.status); // Debug output
        console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug output

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText); // Debug output
            throw new Error(`Failed to fetch appointments: ${response.status} ${errorText}`);
        }

        const appointments = await response.json();
        console.log('Fetched appointments:', appointments); // Debug output
        return appointments;
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

function initializeCalendar() {
    const appointmentsContainer = document.getElementById('appointments');
    appointmentsContainer.innerHTML = ''; // Clear existing content

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

    // Erstelle Container für die nächsten 7 Tage
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-container';
        
        const dayHeader = document.createElement('h3');
        dayHeader.textContent = `${days[date.getDay()]}, ${formatDate(date)}`;
        dayContainer.appendChild(dayHeader);
        
        appointmentsContainer.appendChild(dayContainer);
    }

    // Lade Termine vom Backend
    fetchAppointments(startDate, endDate).then(appointments => {
        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            const dayIndex = Math.floor((appointmentDate - startDate) / (1000 * 60 * 60 * 24));
            
            if (dayIndex >= 0 && dayIndex < 7) {
                const dayContainer = appointmentsContainer.children[dayIndex];
                const appointmentElement = createAppointmentElement(appointment);
                dayContainer.appendChild(appointmentElement);
            }
        });

        // Zeige "Keine Termine" Nachricht für leere Tage
        Array.from(appointmentsContainer.children).forEach(dayContainer => {
            if (dayContainer.children.length === 1) { // Nur der Header ist vorhanden
                const noAppointments = document.createElement('div');
                noAppointments.className = 'no-appointments';
                noAppointments.textContent = 'Keine Termine';
                dayContainer.appendChild(noAppointments);
            }
        });
    });
}

function createAppointmentElement(appointment) {
    const appointmentElement = document.createElement('div');
    appointmentElement.className = `appointment ${appointment.status}`;
    
    const time = document.createElement('div');
    time.className = 'appointment-time';
    time.textContent = new Date(appointment.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    const type = document.createElement('div');
    type.className = 'appointment-type';
    type.textContent = appointment.type;
    
    const status = document.createElement('div');
    status.className = 'appointment-status';
    status.textContent = getStatusText(appointment.status);
    
    appointmentElement.appendChild(time);
    appointmentElement.appendChild(type);
    appointmentElement.appendChild(status);

    if (appointment.status === 'suggested') {
        const actions = document.createElement('div');
        actions.className = 'appointment-actions';
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'accept-btn';
        acceptButton.textContent = 'Annehmen';
        acceptButton.onclick = () => handleAppointmentResponse(appointment.id, 'accepted');
        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'reject-btn';
        rejectButton.textContent = 'Ablehnen';
        rejectButton.onclick = () => handleAppointmentResponse(appointment.id, 'rejected');
        
        actions.appendChild(acceptButton);
        actions.appendChild(rejectButton);
        appointmentElement.appendChild(actions);
    }

    return appointmentElement;
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

        showNotification(`Termin ${newStatus === 'accepted' ? 'angenommen' : 'abgelehnt'}`, 'success');
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