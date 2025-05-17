document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        console.log('Attempting login for user:', username);
        
        // Hole CSRF-Token aus dem Cookie
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_token='))
            ?.split('=')[1];

        if (!csrfToken) {
            console.log('No CSRF token found in cookies');
            throw new Error('CSRF-Token nicht gefunden');
        }

        console.log('Sending login request...');
        const response = await fetch('https://fahrschule-production.up.railway.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Failed to parse response:', error);
            throw new Error('Ungültige Server-Antwort');
        }
        
        if (response.ok) {
            console.log('Login successful, storing session data');
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
            
            console.log('Redirecting to dashboard...');
            // Weiterleitung zum Dashboard
            window.location.href = 'dashboard.html';
        } else {
            console.log('Login failed:', data);
            showError(data.message || 'Login fehlgeschlagen');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Ein Fehler ist aufgetreten');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
} 