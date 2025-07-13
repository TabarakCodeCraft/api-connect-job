const express = require('express');
const profileController = require('../../controller/employee/profile.controller');
const { authenticateToken, authorizeEmployee } = require('../../middleware/auth');
const { uploadCVMiddleware } = require('../../utils/fileUpload');
const { validateProfileUpdate, validateExperience, validateEducation } = require('../../middleware/validation');

const auth = require('../../middleware/auth');

const router = express.Router();

// All routes require authentication and employee authorization
router.use(authenticateToken);
router.use(authorizeEmployee);

// Profile routes
router.get('/profile', profileController.getProfile);
router.put('/profile', validateProfileUpdate, profileController.updateProfile);
router.put('/profile/cv', uploadCVMiddleware, profileController.updateCV);

// Education routes
router.post('/education', validateEducation, profileController.addEducation);
router.put('/education/:educationId', validateEducation, profileController.updateEducation);
router.delete('/education/:educationId', profileController.deleteEducation);

// Experience routes
router.post('/experience', validateExperience, profileController.addExperience);
router.put('/experience/:experienceId', validateExperience, profileController.updateExperience);
router.delete('/experience/:experienceId', profileController.deleteExperience);



module.exports = router;
