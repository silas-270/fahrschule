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

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleButton = sidebar.querySelector('.sidebar-toggle .material-icons');
    
    sidebar.classList.toggle('expanded');
    mainContent.classList.toggle('expanded');
    
    // Toggle icon direction
    if (sidebar.classList.contains('expanded')) {
        toggleButton.textContent = 'chevron_left';
    } else {
        toggleButton.textContent = 'chevron_right';
    }
}

// Benutzer laden und anzeigen
async function loadUsers() {
    try {
        const users = await adminRequest('/admin/users');
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        // Speichere die Benutzer global für die Dialog-Funktionen
        window.users = users.users;

        users.users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
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
            userList.appendChild(userElement);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
    }
}

// Kalender-Navigation
let currentDate = new Date();

function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getWeekDates(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
        const newDate = new Date(monday);
        newDate.setDate(monday.getDate() + i);
        weekDates.push(newDate);
    }
    
    return weekDates;
}

async function loadAppointments() {
    try {
        const weekDates = getWeekDates(currentDate);
        const startDate = weekDates[0];
        const endDate = new Date(weekDates[6]);
        endDate.setHours(23, 59, 59);

        const params = new URLSearchParams({
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });

        const response = await adminRequest(`/admin/appointments?${params.toString()}`, 'GET');
        return response.appointments;
    } catch (error) {
        console.error('Fehler beim Laden der Termine:', error);
        return [];
    }
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
    const weekStart = formatDate(weekDates[0]);
    const weekEnd = formatDate(weekDates[6]);
    document.getElementById('currentWeek').textContent = `Woche vom ${weekStart} bis ${weekEnd}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    
    // Load appointments first
    const appointments = await loadAppointments();
    
    // Create new day containers
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

    // Update each day's content before replacing the old content
    dayContainers.forEach((dayContainer, index) => {
        const date = weekDates[index];
        const dayContent = dayContainer.querySelector('.calendar-day-content');
        
        // Filter appointments for this day
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === date.toDateString();
        });

        // Sort appointments by time
        dayAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Add appointments to the day
        dayAppointments.forEach(apt => {
            const startTime = new Date(apt.date);
            
            const appointmentElement = document.createElement('div');
            appointmentElement.className = `appointment ${getStatusClass(apt.status)}`;
            appointmentElement.innerHTML = `
                <div class="appointment-title">${apt.type}</div>
                <div class="appointment-user">${apt.student_name}</div>
                <div class="appointment-time">${formatTime(startTime)}</div>
                <button class="appointment-delete" onclick="deleteAppointment(${apt.id})">
                    <span class="material-icons">delete</span>
                </button>
            `;
            dayContent.appendChild(appointmentElement);
        });
    });

    // Only replace the old content when everything is ready
    calendarGrid.innerHTML = '';
    dayContainers.forEach(container => calendarGrid.appendChild(container));
}

// Dialog-Funktionen
let currentUserId = null;

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
        alert('Das Passwort muss mindestens 8 Zeichen lang sein.');
        return;
    }

    try {
        await adminRequest(`/admin/users/${currentUserId}/reset-password`, 'POST', {
            newPassword
        });
        alert('Passwort wurde erfolgreich geändert.');
        document.getElementById('newPassword').value = '';
    } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
        alert('Fehler beim Ändern des Passworts');
    }
}

async function deleteUser() {
    if (!currentUserId) return;
    
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
        return;
    }

    try {
        await adminRequest(`/admin/users/${currentUserId}`, 'DELETE');
        alert('Benutzer wurde erfolgreich gelöscht.');
        closeDialog('userSettingsDialog');
        loadUsers(); // Liste neu laden
    } catch (error) {
        console.error('Fehler beim Löschen des Benutzers:', error);
        alert('Fehler beim Löschen des Benutzers');
    }
}

async function deleteAppointment(appointmentId) {
    if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
        try {
            await adminRequest(`/appointments/${appointmentId}`, 'DELETE');
            await updateCalendar();
        } catch (error) {
            console.error('Fehler beim Löschen des Termins:', error);
            alert('Fehler beim Löschen des Termins');
        }
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
    const title = document.getElementById('createAppointmentTitle');
    const user = window.users.find(u => u.id === userId);
    if (user) {
        title.textContent = `Termin für ${user.username} erstellen`;
        dialog.style.display = 'flex';
        
        // Setze heutiges Datum als Standard
        const today = new Date();
        const dateInput = document.getElementById('appointmentDate');
        dateInput.value = today.toISOString().split('T')[0];
        
        // Setze aktuelle Stunde als Standard
        const hourInput = document.getElementById('appointmentHour');
        const minuteInput = document.getElementById('appointmentMinute');
        hourInput.value = today.getHours().toString().padStart(2, '0');
        minuteInput.value = today.getMinutes().toString().padStart(2, '0');
    }
}

function closeDialog(dialogId) {
    document.getElementById(dialogId).style.display = 'none';
}

async function saveAppointment() {
    if (!currentUserId) return;

    const title = document.getElementById('appointmentTitle').value;
    const duration = document.getElementById('appointmentDuration').value;
    const date = document.getElementById('appointmentDate').value;
    const hour = document.getElementById('appointmentHour').value;
    const minute = document.getElementById('appointmentMinute').value;

    if (!title || !date || !hour || !minute) {
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
    }

    // Validiere Uhrzeit
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    if (hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59) {
        alert('Bitte geben Sie eine gültige Uhrzeit ein.');
        return;
    }

    // Erstelle ISO-Datetime-String
    const dateTime = new Date(date);
    dateTime.setHours(hourNum, minuteNum);
    
    // Kombiniere Titel und Dauer
    const fullTitle = duration ? `${title} - ${duration}` : title;
    
    try {
        await adminRequest('/appointments', 'POST', {
            student_id: currentUserId,
            date: dateTime.toISOString(),
            type: fullTitle
        });
        
        alert('Termin wurde erfolgreich erstellt.');
        closeDialog('createAppointmentDialog');
        updateCalendar();
    } catch (error) {
        console.error('Fehler beim Erstellen des Termins:', error);
        alert('Fehler beim Erstellen des Termins');
    }
}

// Event-Listener für Datum-Input
document.getElementById('appointmentDate').addEventListener('change', function(e) {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    
    // Wenn das ausgewählte Datum in der Vergangenheit liegt
    if (selectedDate < today) {
        alert('Bitte wählen Sie ein zukünftiges Datum.');
        e.target.value = today.toISOString().split('T')[0];
    }
});

// Event-Listener für Stunde-Input
document.getElementById('appointmentHour').addEventListener('change', function(e) {
    let value = parseInt(e.target.value);
    if (value < 0) value = 0;
    if (value > 23) value = 23;
    e.target.value = value.toString().padStart(2, '0');
});

// Event-Listener für Minute-Input
document.getElementById('appointmentMinute').addEventListener('change', function(e) {
    let value = parseInt(e.target.value);
    if (value < 0) value = 0;
    if (value > 59) value = 59;
    e.target.value = value.toString().padStart(2, '0');
});

// Initialisierung
window.addEventListener('load', () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || session.role !== 'admin') {
        window.location.href = 'index.html';
    }
    loadUsers();
    updateCalendar();
});

function logout() {
    localStorage.removeItem('session');
    window.location.href = 'index.html';
}

function openNewUserDialog() {
    const dialog = document.getElementById('newUserDialog');
    const form = document.getElementById('newUserForm');
    dialog.style.display = 'flex';
    form.reset();
    document.getElementById('newUsername').focus();
}

async function createNewUser() {
    const form = document.getElementById('newUserForm');
    const formData = new FormData(form);
    
    const username = formData.get('username').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    console.log('Formular-Daten:', {
        username,
        password,
        confirmPassword
    });

    if (!username || !password || !confirmPassword) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }

    if (password.length < 8) {
        alert('Das Passwort muss mindestens 8 Zeichen lang sein.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Die Passwörter stimmen nicht überein.');
        return;
    }

    try {
        const response = await adminRequest('/admin/users', 'POST', {
            username,
            password
        });
        
        console.log('Server-Antwort:', response);
        alert('Benutzer wurde erfolgreich erstellt.');
        closeDialog('newUserDialog');
        form.reset();
        loadUsers(); // Liste neu laden
    } catch (error) {
        console.error('Fehler beim Erstellen des Benutzers:', error);
        alert('Fehler beim Erstellen des Benutzers: ' + error.message);
    }
}