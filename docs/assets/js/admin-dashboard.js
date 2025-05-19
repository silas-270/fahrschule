import { appointmentService } from './services/appointmentService.js';
import { formatDateForDisplay, formatTimeForDisplay, isSameDay } from './utils/timezone.js';

const API_URL = CONFIG.API_URL;

// Hilfsfunktion für Admin-Anfragen
async function adminRequest(endpoint, method = 'GET', body = null) {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || session.role !== 'admin' || !session.adminToken) {
        throw new Error('Nicht autorisiert');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'admin-token': session.adminToken
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error('Anfrage fehlgeschlagen');
    }

    return await response.json();
}

// Globale Variablen
let currentDate = new Date();
let currentUserId = null;
let activeUserFilter = null; // Speichert die ID des aktiven Benutzer-Filters

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleButton = sidebar.querySelector('.sidebar-toggle .material-icons');
    
    sidebar.classList.toggle('expanded');
    mainContent.classList.toggle('expanded');
    
    if (sidebar.classList.contains('expanded')) {
        toggleButton.textContent = 'chevron_left';
    } else {
        toggleButton.textContent = 'chevron_right';
    }
}

// Benutzer laden und anzeigen
async function loadUsers() {
    try {
        const response = await appointmentService.request('/admin/users', 'GET', null, true);
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        window.users = response.users;

        response.users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.dataset.userId = user.id;
            userElement.innerHTML = `
                <div class="user-info">
                    <span class="material-icons">person</span>
                    <span>${user.username}</span>
                </div>
                <div class="user-actions">
                    <button class="action-button" onclick="createAppointment(${user.id})">
                        <span class="material-icons">add</span>
                    </button>
                    <button class="action-button" onclick="openUserSettings(${user.id})">
                        <span class="material-icons">settings</span>
                    </button>
                </div>
            `;
            
            // Füge Click-Event für den Filter hinzu
            userElement.addEventListener('click', (event) => {
                // Verhindere das Auslösen des Filters, wenn auf die Action-Buttons geklickt wird
                if (event.target.closest('.action-button')) {
                    return;
                }
                toggleUserFilter(user.id);
            });
            
            userList.appendChild(userElement);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        showNotification('Fehler beim Laden der Benutzer', 'error');
    }
}

// Funktion zum Umschalten des Benutzer-Filters
function toggleUserFilter(userId) {
    const userElements = document.querySelectorAll('.user-item');
    
    // Wenn der gleiche Benutzer erneut geklickt wird, deaktiviere den Filter
    if (activeUserFilter === userId) {
        activeUserFilter = null;
        userElements.forEach(element => {
            element.classList.remove('active');
        });
    } else {
        // Aktiviere den Filter für den neuen Benutzer
        activeUserFilter = userId;
        userElements.forEach(element => {
            if (element.dataset.userId === userId.toString()) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }
    
    // Aktualisiere die Termine basierend auf dem Filter
    updateCalendar();
}

function getWeekDates(date) {
    // Erstelle eine Kopie des Datums, um das Original nicht zu verändern
    const currentDate = new Date(date);
    
    // Berechne den Tag der Woche (0 = Sonntag, 1 = Montag, ..., 6 = Samstag)
    const day = currentDate.getDay();
    
    // Berechne die Differenz zum Montag
    // Wenn Sonntag (0), dann -6 Tage, sonst 1 - day
    const diff = day === 0 ? -6 : 1 - day;
    
    // Erstelle das Montagsdatum
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    const weekDates = [];
    
    // Generiere die Daten für die ganze Woche
    for (let i = 0; i < 7; i++) {
        const newDate = new Date(monday);
        newDate.setDate(monday.getDate() + i);
        weekDates.push(newDate);
    }
    
    return weekDates;
}

function getStatusClass(status) {
    switch (status) {
        case 'accepted':
            return '';
        case 'suggested':
            return 'pending';
        case 'rejected':
            return 'cancelled';
        default:
            return '';
    }
}

async function updateCalendar() {
    const weekDates = getWeekDates(currentDate);
    const weekStart = formatDateForDisplay(weekDates[0]);
    const weekEnd = formatDateForDisplay(weekDates[6]);
    document.getElementById('currentWeek').textContent = `Woche vom ${weekStart} bis ${weekEnd}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    
    try {
        const startDate = weekDates[0];
        const endDate = new Date(weekDates[6]);
        endDate.setHours(23, 59, 59, 999);
        
        const appointments = await appointmentService.getAppointments(startDate, endDate, true);
        
        // Filtere die Termine basierend auf dem aktiven Benutzer-Filter
        const filteredAppointments = activeUserFilter 
            ? appointments.filter(apt => apt.student_id === activeUserFilter)
            : appointments;
        
        const dayContainers = weekDates.map(date => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
            dayElement.innerHTML = `
                <div class="calendar-day-header">${dayName}</div>
                <div class="calendar-day-content"></div>
            `;
            return dayElement;
        });

        dayContainers.forEach((dayContainer, index) => {
            const date = weekDates[index];
            const dayContent = dayContainer.querySelector('.calendar-day-content');
            
            const dayAppointments = filteredAppointments.filter(apt => {
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

            dayAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

            dayAppointments.forEach(apt => {
                const startTime = new Date(apt.date);
                
                const appointmentElement = document.createElement('div');
                appointmentElement.className = `appointment ${getStatusClass(apt.status)}`;
                appointmentElement.innerHTML = `
                    <div class="appointment-title">${apt.type}</div>
                    <div class="appointment-user">${apt.student_name}</div>
                    <div class="appointment-time">${formatTimeForDisplay(startTime)}</div>
                    <button class="appointment-delete" onclick="deleteAppointment(${apt.id})">
                        <span class="material-icons">delete</span>
                    </button>
                `;
                dayContent.appendChild(appointmentElement);
            });
        });

        calendarGrid.innerHTML = '';
        dayContainers.forEach(container => calendarGrid.appendChild(container));
    } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
        showNotification('Fehler beim Laden der Termine', 'error');
    }
}

// Dialog-Funktionen
function openUserSettings(userId) {
    currentUserId = userId;
    const dialog = document.getElementById('userSettingsDialog');
    const title = document.getElementById('userSettingsTitle');
    const user = window.users.find(u => u.id === userId);
    if (user) {
        title.textContent = `${user.username} bearbeiten`;
        dialog.style.display = 'flex';
    }
}

async function changePassword() {
    if (!currentUserId) return;
    
    const newPassword = document.getElementById('newPassword').value;
    if (!newPassword || newPassword.length < 8) {
        showNotification('Das Passwort muss mindestens 8 Zeichen lang sein.', 'error');
        return;
    }

    try {
        await appointmentService.request(`/admin/users/${currentUserId}/reset-password`, 'POST', {
            newPassword
        }, true);
        showNotification('Passwort wurde erfolgreich geändert.', 'success');
        document.getElementById('newPassword').value = '';
    } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
        showNotification('Fehler beim Ändern des Passworts', 'error');
    }
}

async function deleteUser() {
    if (!currentUserId) return;
    
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen? Alle zugehörigen Termine werden ebenfalls gelöscht.')) {
        return;
    }

    try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.token || !session.adminToken) {
            throw new Error('Nicht autorisiert');
        }

        // Zuerst alle Termine des Benutzers abrufen
        const startDate = new Date(2000, 0, 1); // Sehr frühes Datum
        const endDate = new Date(2100, 0, 1);   // Sehr spätes Datum
        
        const appointments = await appointmentService.getAppointments(startDate, endDate, true);
        
        // Filtere Termine des Benutzers
        const userAppointments = appointments.filter(apt => apt.student_id === currentUserId);
        
        // Lösche jeden Termin des Benutzers
        for (const appointment of userAppointments) {
            await appointmentService.deleteAppointment(appointment.id, true);
        }

        // Dann den Benutzer löschen
        const response = await fetch(`${API_URL}/admin/users/${currentUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.token}`,
                'admin-token': session.adminToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server response:', errorData);
            throw new Error(`Server-Fehler: ${response.status} - ${errorData}`);
        }

        showNotification('Benutzer und alle zugehörigen Termine wurden erfolgreich gelöscht.', 'success');
        closeDialog('userSettingsDialog');
        loadUsers();
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        showNotification(`Fehler beim Löschen des Benutzers: ${error.message}`, 'error');
    }
}

async function deleteAppointment(appointmentId) {
    if (!confirm('Möchten Sie diesen Termin wirklich löschen?')) {
        return;
    }

    try {
        await appointmentService.deleteAppointment(appointmentId, true);
        showNotification('Termin wurde erfolgreich gelöscht.', 'success');
        updateCalendar();
    } catch (error) {
        console.error('Fehler beim Löschen des Termins:', error);
        showNotification('Fehler beim Löschen des Termins', 'error');
    }
}

function previousWeek() {
    currentDate.setDate(currentDate.getDate() - 7);
    updateCalendar();
}

function nextWeek() {
    currentDate.setDate(currentDate.getDate() + 7);
    updateCalendar();
}

function createAppointment(userId) {
    currentUserId = userId;
    const dialog = document.getElementById('createAppointmentDialog');
    
    // Setze das Standarddatum auf heute
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('appointmentDate').value = `${year}-${month}-${day}`;
    
    // Setze die Uhrzeit-Eingabefelder zurück
    document.getElementById('appointmentHour').value = '';
    document.getElementById('appointmentMinute').value = '';
    
    // Füge Event-Listener für die automatische Fokus-Weiterleitung hinzu
    const hourInput = document.getElementById('appointmentHour');
    const minuteInput = document.getElementById('appointmentMinute');
    
    hourInput.oninput = function() {
        // Begrenze die Eingabe auf 2 Ziffern
        if (this.value.length > 2) {
            this.value = this.value.slice(0, 2);
        }
        // Wenn 2 Ziffern eingegeben wurden, fülle mit 0 auf und wechsle zum Minutenfeld
        if (this.value.length === 2) {
            this.value = this.value.padStart(2, '0');
            minuteInput.focus();
        }
    };
    
    minuteInput.oninput = function() {
        // Begrenze die Eingabe auf 2 Ziffern
        if (this.value.length > 2) {
            this.value = this.value.slice(0, 2);
        }
        // Wenn 2 Ziffern eingegeben wurden, fülle mit 0 auf und entferne den Fokus
        if (this.value.length === 2) {
            this.value = this.value.padStart(2, '0');
            this.blur();
        }
    };
    
    // Füge Event-Listener für das Verlassen der Felder hinzu
    hourInput.onblur = function() {
        if (this.value) {
            this.value = this.value.padStart(2, '0');
        }
    };
    
    minuteInput.onblur = function() {
        if (this.value) {
            this.value = this.value.padStart(2, '0');
        }
    };
    
    dialog.style.display = 'flex';
}

function closeDialog(dialogId) {
    document.getElementById(dialogId).style.display = 'none';
}

async function saveAppointment() {
    const title = document.getElementById('appointmentTitle').value;
    const duration = document.getElementById('appointmentDuration').value;
    const date = document.getElementById('appointmentDate').value;
    const hour = document.getElementById('appointmentHour').value;
    const minute = document.getElementById('appointmentMinute').value;

    if (!title || !date || !hour || !minute) {
        showNotification('Bitte füllen Sie alle Pflichtfelder aus.', 'error');
        return;
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hour), parseInt(minute));

    try {
        // Kombiniere Titel und Dauer, wenn eine Dauer angegeben wurde
        const finalTitle = duration ? `${title} - ${duration}` : title;

        await appointmentService.createAppointment({
            student_id: currentUserId,
            type: finalTitle,
            duration: duration || null,
            date: appointmentDate.toISOString()
        }, true);

        showNotification('Termin wurde erfolgreich erstellt.', 'success');
        closeDialog('createAppointmentDialog');
        updateCalendar();

        // Formular zurücksetzen
        document.getElementById('appointmentTitle').value = '';
        document.getElementById('appointmentDuration').value = '';
        document.getElementById('appointmentDate').value = '';
        document.getElementById('appointmentHour').value = '';
        document.getElementById('appointmentMinute').value = '';
    } catch (error) {
        console.error('Fehler beim Erstellen des Termins:', error);
        showNotification('Fehler beim Erstellen des Termins', 'error');
    }
}

function openNewUserDialog() {
    const dialog = document.getElementById('newUserDialog');
    dialog.style.display = 'flex';
}

async function createNewUser() {
    const form = document.getElementById('newUserForm');
    const usernameInput = form.querySelector('#newUsername');
    const passwordInput = form.querySelector('#newPassword');
    const confirmPasswordInput = form.querySelector('#confirmPassword');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validiere die Eingaben
    if (!username) {
        showNotification('Bitte geben Sie einen Benutzernamen ein.', 'error');
        return;
    }

    if (!password) {
        showNotification('Bitte geben Sie ein Passwort ein.', 'error');
        return;
    }

    if (!confirmPassword) {
        showNotification('Bitte bestätigen Sie das Passwort.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Die Passwörter stimmen nicht überein.', 'error');
        return;
    }

    if (password.length < 8) {
        showNotification('Das Passwort muss mindestens 8 Zeichen lang sein.', 'error');
        return;
    }

    try {
        await appointmentService.request('/admin/users', 'POST', {
            username,
            password
        }, true);

        showNotification('Benutzer wurde erfolgreich erstellt.', 'success');
        closeDialog('newUserDialog');
        loadUsers();

        // Formular zurücksetzen
        form.reset();
    } catch (error) {
        console.error('Fehler beim Erstellen des Benutzers:', error);
        showNotification('Fehler beim Erstellen des Benutzers', 'error');
    }
}

// Mache alle benötigten Funktionen global verfügbar
window.toggleSidebar = toggleSidebar;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;
window.closeDialog = closeDialog;
window.openNewUserDialog = openNewUserDialog;
window.createNewUser = createNewUser;
window.openUserSettings = openUserSettings;
window.changePassword = changePassword;
window.deleteUser = deleteUser;
window.createAppointment = createAppointment;
window.deleteAppointment = deleteAppointment;
window.saveAppointment = saveAppointment;

// Mache die logout Funktion global verfügbar
window.logout = function() {
    localStorage.removeItem('session');
    window.location.href = 'index.html';
};

function showNotification(message, type = 'info') {
    // Implementiere deine Benachrichtigungsfunktion hier
    console.log(`${type}: ${message}`);
}

// Initialisierung
window.addEventListener('load', () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || session.role !== 'admin') {
        window.location.href = 'index.html';
    }
    loadUsers();
    updateCalendar();
});

// Funktion zum Überprüfen der Session
function checkSession() {
    // ... existing code ...
}
