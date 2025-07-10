const express = require('express');
const router = express.Router();
const { getMatchedJobs } = require('../../controller/employee/job.controller');
const { authenticateToken } = require('../../middleware/auth');

router.get('/matched-jobs', authenticateToken, getMatchedJobs);

module.exports = router; 