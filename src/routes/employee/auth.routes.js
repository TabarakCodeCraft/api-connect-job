// routes/employeeRoutes.js
const express = require('express');
const employeeController = require('../../controller/employee/auth.controller');
const { authenticateToken, authorizeEmployee } = require('../../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate
} = require('../../middleware/validation');
const rateLimiter = require('../../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.post('/register',
  rateLimiter.register,
  validateRegistration,
  employeeController.register
);

router.post('/login',
  rateLimiter.login,
  validateLogin,
  employeeController.login
);

router.use(authenticateToken);
router.use(authorizeEmployee);

router.post('/logout', employeeController.logout);

router.post('/refresh-token', employeeController.refreshToken);

router.get('/users', (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

module.exports = router;