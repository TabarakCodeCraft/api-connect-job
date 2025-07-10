const express = require('express');
const router = express.Router();
const { getAllSecretCodes, expireSecretCode, deleteSecretCode, generateUnassignedSecretCode } = require('../../controller/admin/secretCode.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, getAllSecretCodes);
router.post('/:id/expire', authenticateToken, authorizeAdmin, expireSecretCode);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteSecretCode);
router.post('/generate-unassigned', authenticateToken, authorizeAdmin, generateUnassignedSecretCode);

module.exports = router; 