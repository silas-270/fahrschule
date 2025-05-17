import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// CSRF Token Generation
export function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Input Validation
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // Basic XSS protection
        .replace(/[&]/g, '&amp;')
        .replace(/["]/g, '&quot;')
        .replace(/[']/g, '&#x27;')
        .replace(/[/]/g, '&#x2F;');
}

// Validate email format
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate username format
export function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// Validate password strength
export function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
}

// Generate refresh token
export function generateRefreshToken(userId) {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

// Verify refresh token
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
}

// Security headers middleware
export function securityHeaders(req, res, next) {
    // Content Security Policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self'"
    );

    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
}

// Request validation middleware
export function validateRequest(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validierungsfehler',
                details: error.details.map(detail => detail.message)
            });
        }
        next();
    };
}

// Error logging middleware
export function errorLogger(err, req, res, next) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        error: {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    };

    console.error('Security Error:', errorLog);
    next(err);
}

// Session validation middleware
export function validateSession(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token abgelaufen' });
        }
        return res.status(401).json({ message: 'Ungültiger Token' });
    }
} 