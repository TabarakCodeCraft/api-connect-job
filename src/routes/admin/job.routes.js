const express = require('express');
const router = express.Router();
const { getAllJobs, getJobById, deleteJob } = require('../../controller/admin/job.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

router.get('/', authenticateToken, authorizeAdmin, getAllJobs);
router.get('/:id', authenticateToken, authorizeAdmin, getJobById);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteJob);

module.exports = router; 