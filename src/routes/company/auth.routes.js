const express = require('express');
const { registerCompany, loginCompany, refreshTokenCompany } = require('../../controller/company/auth.controller');

const router = express.Router();

router.post('/register', registerCompany);
router.post('/login', loginCompany);
router.post('/refresh-token', refreshTokenCompany);

module.exports = router; 