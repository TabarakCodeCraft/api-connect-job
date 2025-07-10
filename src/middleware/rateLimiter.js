// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for registration endpoints
 * Allows 5 registration attempts per IP per hour
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 3600 // seconds
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests
    skipSuccessfulRequests: true,
    // Custom key generator (you can customize this based on your needs)
    keyGenerator: (req) => {
        return req.ip + ':register';
    }
});

/**
 * Rate limiter for login endpoints
 * Allows 10 login attempts per IP per 15 minutes
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 900 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':login';
    }
});

/**
 * Rate limiter for password reset endpoints
 * Allows 3 password reset attempts per IP per hour
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 3600 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':password-reset';
    }
});

/**
 * General API rate limiter
 * Allows 100 requests per IP per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 900 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

module.exports = {
    register: registerLimiter,
    login: loginLimiter,
    passwordReset: passwordResetLimiter,
    api: apiLimiter
};