const express = require('express');
const router = express.Router();
const { getAllEmployees, deleteEmployee } = require('../../controller/admin/employee.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, getAllEmployees);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteEmployee);

module.exports = router; 