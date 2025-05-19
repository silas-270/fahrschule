// Cookie-Banner Funktionalität
document.addEventListener('DOMContentLoaded', function() {
    // Prüfe, ob der Benutzer bereits zugestimmt hat
    const hasConsented = localStorage.getItem('cookieConsent');
    
    if (!hasConsented) {
        // Erstelle den Cookie-Banner
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.style.cssText = `
            position: fixed;
            top: 65%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #303030;
            color: #F3F3F3;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            max-width: 90%;
            width: 400px;
        `;
        
        // Banner-Inhalt
        banner.innerHTML = `
            <div style="flex: 1;">
                <p style="margin: 0; color: #BDBDBD; line-height: 1.5;">
                    Wir verwenden Cookies, um Ihnen das beste Nutzererlebnis zu bieten. 
                    <a href="datenschutz.html" style="color: #2196F3; text-decoration: none;">Mehr erfahren</a>
                </p>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button id="accept-cookies" style="
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s ease;
                ">Akzeptieren</button>
            </div>
        `;
        
        // Füge den Banner zum Body hinzu
        document.body.appendChild(banner);
        
        // Event-Listener für den Akzeptieren-Button
        document.getElementById('accept-cookies').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'true');
            banner.style.display = 'none';
            
            // Aktiviere den Login-Button, falls vorhanden
            const loginButton = document.getElementById('login-button');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.style.opacity = '1';
                loginButton.style.cursor = 'pointer';
            }
            
            // Verstecke die Cookie-Message, falls vorhanden
            const cookieMessage = document.getElementById('cookie-message');
            if (cookieMessage) {
                cookieMessage.style.display = 'none';
            }
        });
    } else {
        // Wenn bereits zugestimmt wurde, aktiviere den Login-Button
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.style.opacity = '1';
            loginButton.style.cursor = 'pointer';
        }
        
        // Verstecke die Cookie-Message
        const cookieMessage = document.getElementById('cookie-message');
        if (cookieMessage) {
            cookieMessage.style.display = 'none';
        }
    }
}); 