const express = require('express');
const router = express.Router();
const { getAllEmployees } = require('../../controller/admin/employee.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, getAllEmployees);

module.exports = router; 