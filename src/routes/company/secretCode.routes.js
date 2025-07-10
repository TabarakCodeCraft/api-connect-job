const express = require('express');
const {
  createSecretCode,
  getAllSecretCodes,
  getSecretCodeById,
  updateSecretCode,
  deleteSecretCode,
  getSecretCodesByCompany,
  expireSecretCodeForCurrentCompany,
} = require('../../controller/company/secretCode.controller');
const { authenticateToken, authorizeCompany } = require('../../middleware/auth');

const router = express.Router();

// CRUD operations for secret codes
router.post('/', createSecretCode);
router.get('/', getAllSecretCodes);
router.get('/:id', getSecretCodeById);
router.put('/:id', updateSecretCode);
router.delete('/:id', deleteSecretCode);

// Get secret codes by company
router.get('/company/:companyId', getSecretCodesByCompany);

// Expire secret code for current company
router.post('/expire', authenticateToken, authorizeCompany, expireSecretCodeForCurrentCompany);

module.exports = router; 