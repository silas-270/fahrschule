document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Hole CSRF-Token aus dem Cookie
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_token='))
            ?.split('=')[1];

        if (!csrfToken) {
            throw new Error('CSRF-Token nicht gefunden');
        }

        const response = await fetch('https://fahrschule-backend.up.railway.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Speichere Session-Daten mit Login-Zeitpunkt
            const sessionData = {
                token: data.token,
                refreshToken: data.refreshToken,
                username: data.user.username,
                role: data.user.role,
                timestamp: Date.now()
            };
            
            // Debug-Ausgabe
            console.log('Storing session data:', sessionData);
            
            // Speichere die Session
            localStorage.setItem('session', JSON.stringify(sessionData));
            
            // Überprüfe, ob die Session gespeichert wurde
            const storedSession = localStorage.getItem('session');
            console.log('Stored session:', storedSession);
            
            if (!storedSession) {
                throw new Error('Failed to store session data');
            }
            
            // Weiterleitung zum Dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError(data.message || 'Login fehlgeschlagen');
        }
    } catch (error) {
        console.error('Fehler:', error);
        showError('Ein Fehler ist aufgetreten');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
} 