// middleware/validation.js
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for employee registration
 */
const validateRegistration = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 2 })
    .withMessage('Username must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  validate
];

/**
 * Validation rules for employee login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

/**
 * Validation rules for profile updates
 */
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Username must be at least 2 characters long'),
  body('fullName')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please provide a valid phone number'),
  body('governorate')
    .optional()
    .isIn([
      'BAGHDAD','NINEVEH','BASRAH','ERBIL','DHI_QAR','SULAYMANIYAH','BABIL','DIYALA','ANBAR','KIRKUK','NAJAF','SALAHADIN','WASIT','MUTHANNA','QADISIYAH','MAYSAN','KARABALA','DAHUK'
    ])
    .withMessage('Invalid governorate'),
  body('jobTitle')
    .optional()
    .isIn([
      'MEDICAL_REPRESENTATIVE','SENIOR_MEDICAL_REPRESENTATIVE','PRODUCT_MANAGER','SENIOR_PRODUCT_MANAGER','TEAM_LEADER','MEDICAL_SUPERVISOR','SALES_MANAGER','PROMOTION_MANAGER','AREA_SALES_MANAGER','DISTRICT_SALES_MANAGER','NATIONAL_SALES_MANAGER','COUNTRY_MANAGER','GENERAL_MANAGER','SALES_FORCE_EFFECTIVENESS_MANAGER','DATA_ANALYTICAL','WAREHOUSE_MANAGER','MARKETING_MANAGER','SALES_REPRESENTATIVE','SALES_SUPERVISOR','REGULATORY_AFFAIRS','HR_ASSOCIATE','HR_MANAGER','ADMIN','ACCOUNTANT','COLLECTOR','FINANCE_MANAGER','DRIVER'
    ])
    .withMessage('Invalid job title'),
  validate
];

/**
 * Validation rules for employee experience
 */
const validateExperience = [
  body('company')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  body('lineOfWork')
    .optional()
    .isIn([
      'INTERNAL_MEDICINE','ENDOCRINOLOGIST','CARDIOLOGIST','GASTROENTEROLOGIST',
      'OBSTETRICS_AND_GYNECOLOGIST','OPHTHALMOLOGIST','PEDIATRICS','ENT','NEUROLOGIST',
      'NEPHROLOGIST','ONCOLOGIST','UROLOGIST','DERMATOLOGIST','HEMATOLOGIST',
      'GENERAL_PRACTITIONER','EMERGENCY_MEDICINE','PSYCHIATRIC','RADIOLOGIST','DENTIST',
      'FAMILY_MEDICINE','SPORTS_MEDICINE','RHEUMATOLOGY','ANESTHESIOLOGY_AND_RECOVERY',
      'NUCLEAR_MEDICINE','SPEECH_LANGUAGE','PEDIATRIC_SURGERY','PLASTIC_SURGERY',
      'NEUROSURGERY','CARDIO_VASCULAR_SURGERY','ORTHOPEDICS','GENERAL_SURGERY',
      'NUTRITIONIST','MOH','RESPIRATORY_MEDICINE','MIDWIFE','NURSES','PHYSIO_THERAPY'
    ])
    .withMessage('Invalid line of work'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation rules for employee education
 */
const validateEducation = [
  body('institution')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution name must be between 2 and 100 characters'),
  body('degree')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Degree must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation rules for password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password confirmation does not match new password');
      }
      return true;
    }),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateExperience,
  validateEducation,
  validatePasswordChange
};