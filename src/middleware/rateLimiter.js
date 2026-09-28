const rateLimit = require('express-rate-limit');


const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5, 
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 3600 
    },
    standardHeaders: true, 
    legacyHeaders: false, 
  
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':register';
    }
});


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 900 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':login';
    }
});


const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3, 
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 3600 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        return req.ip + ':password-reset';
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retry_after: 900
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
