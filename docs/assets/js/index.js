const API_URL = CONFIG.API_URL;

// Prüfe ob bereits eine Session existiert
window.addEventListener('load', () => {
    const session = localStorage.getItem('session');
    if (session) {
        window.location.href = 'dashboard.html';
    }
});

function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.style.display = 'block';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Login response:', data); // Debug output
            
            // Speichere Session-Informationen
            const sessionData = {
                username: data.user.username,
                role: data.user.role,
                token: data.token,
                timestamp: Date.now()
            };

            // Wenn Admin-Token vorhanden, speichere ihn
            if (data.adminToken) {
                sessionData.adminToken = data.adminToken;
            }
            
            console.log('Storing session data:', sessionData); // Debug output
            localStorage.setItem('session', JSON.stringify(sessionData));
            
            showMessage('Login erfolgreich! Weiterleitung...');
            setTimeout(() => {
                // Prüfe die Benutzerrolle
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        } else {
            showMessage(data.message || 'Login fehlgeschlagen', true);
        }
    } catch (error) {
        showMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.', true);
        console.error('Login error:', error);
    }
});