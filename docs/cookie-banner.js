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
            bottom: 0;
            left: 0;
            right: 0;
            background: #303030;
            color: #F3F3F3;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
        `;
        
        // Banner-Inhalt
        banner.innerHTML = `
            <div style="flex: 1; margin-right: 1rem;">
                <p style="margin: 0; color: #BDBDBD;">
                    Wir verwenden Cookies, um Ihnen das beste Nutzererlebnis zu bieten. 
                    <a href="datenschutz.html" style="color: #2196F3; text-decoration: none;">Mehr erfahren</a>
                </p>
            </div>
            <div>
                <button id="accept-cookies" style="
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
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