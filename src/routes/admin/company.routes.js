const express = require('express');
const router = express.Router();
const { getAllCompanies, generateSecretCode } = require('../../controller/admin/company.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, getAllCompanies);
router.post('/:id/generate-secret-code', authenticateToken, authorizeAdmin, generateSecretCode);

module.exports = router; 