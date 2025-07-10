const express = require('express');
const {
  getAllCompanyRequests,
  getCompanyRequestById,
  approveCompanyRequest,
  rejectCompanyRequest,
  deleteCompanyRequest,
} = require('../../controller/admin/companyRequest.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

const router = express.Router();

// Get all company requests
router.get('/', authenticateToken, authorizeAdmin, getAllCompanyRequests);

// Get company request by ID
router.get('/:id', authenticateToken, authorizeAdmin, getCompanyRequestById);

// Approve company request
router.post('/:id/approve', authenticateToken, authorizeAdmin, approveCompanyRequest);

// Reject company request
router.post('/:id/reject', authenticateToken, authorizeAdmin, rejectCompanyRequest);

// Delete company request
router.delete('/:id', authenticateToken, authorizeAdmin, deleteCompanyRequest);

module.exports = router; 