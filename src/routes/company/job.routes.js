const express = require('express');
const router = express.Router();
const jobController = require('../../controller/company/job.controller');
const { authenticateToken, authorizeCompany } = require('../../middleware/auth');

// نشر وظيفة جديدة (يجب أن يكون المستخدم شركة)
router.post('/', authenticateToken, authorizeCompany, jobController.createJob);

// جلب جميع الوظائف الخاصة بالشركة
router.get('/', authenticateToken, authorizeCompany, jobController.getJobs);

// جلب وظيفة واحدة بالتفصيل
router.get('/:id', authenticateToken, authorizeCompany, jobController.getJobById);

// تحديث وظيفة
router.put('/:id', authenticateToken, authorizeCompany, jobController.updateJob);

// حذف وظيفة
router.delete('/:id', authenticateToken, authorizeCompany, jobController.deleteJob);

module.exports = router; 