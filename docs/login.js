document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Hole zuerst einen CSRF-Token
        const csrfResponse = await fetch('https://fahrschule-backend.up.railway.app/csrf-token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!csrfResponse.ok) {
            throw new Error('Fehler beim Abrufen des CSRF-Tokens');
        }
        
        const csrfData = await csrfResponse.json();
        
        // Login-Anfrage mit CSRF-Token
        const response = await fetch('https://fahrschule-backend.up.railway.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfData.csrfToken,
                'x-session-token': csrfData.sessionToken
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Speichere Session-Daten mit Login-Zeitpunkt
            const sessionData = {
                token: data.token,
                username: username,
                role: data.role,
                timestamp: Date.now(),
                csrfToken: data.csrfToken,
                sessionToken: data.sessionToken
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