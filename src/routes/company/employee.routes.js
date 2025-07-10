const express = require('express');
const router = express.Router();
const { getAllEmployeesPublic, getEmployeeFilterOptions, getEmployeeById, getEmployeeStats } = require('../../controller/employee/profile.controller');

// Get all employees (public/company view)
router.get('/', getAllEmployeesPublic);
// Get dynamic filter options
router.get('/filters', getEmployeeFilterOptions);
// Get employee statistics
router.get('/stats', getEmployeeStats);
// Get a single employee by ID
router.get('/:id', getEmployeeById);

module.exports = router;
