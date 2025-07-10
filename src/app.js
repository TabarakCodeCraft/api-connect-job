const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./utils/errorHandler');
const employeeAuthRoutes = require('./routes/employee/auth.routes');
const employeeProfileRoutes = require('./routes/employee/profile.routes');
const employeeNotificationRoutes = require('./routes/employee/notification.routes');
const companyAuthRoutes = require('./routes/company/auth.routes');
const companySecretCodeRoutes = require('./routes/company/secretCode.routes');
const companyNotificationRoutes = require('./routes/company/notification.routes');
const companyEmployeeRoutes = require('./routes/company/employee.routes');
const adminCompanyRequestRoutes = require('./routes/admin/companyRequest.routes');
const adminAuthRoutes = require('./routes/admin/auth.routes');
const adminCompanyRoutes = require('./routes/admin/company.routes');
const adminEmployeeRoutes = require('./routes/admin/employee.routes');
const adminSecretCodeRoutes = require('./routes/admin/secretCode.routes');
const adminNotificationRoutes = require('./routes/admin/notification.routes');
const companyJobRoutes = require('./routes/company/job.routes');
const employeeJobRoutes = require('./routes/employee/job.routes');

const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Connect Jobs API'
  });
});

app.use('/api/employee', employeeAuthRoutes);
app.use('/api/employee', employeeProfileRoutes);
app.use('/api/employee/notifications', employeeNotificationRoutes);
app.use('/api/employee/jobs', employeeJobRoutes);
app.use('/api/company', companyAuthRoutes);
app.use('/api/company/secret-codes', companySecretCodeRoutes);
app.use('/api/company/notifications', companyNotificationRoutes);
app.use('/api/company/employees', companyEmployeeRoutes);
app.use('/api/company/jobs', companyJobRoutes);
app.use('/api/admin/company-requests', adminCompanyRequestRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/companies', adminCompanyRoutes);
app.use('/api/admin/employees', adminEmployeeRoutes);
app.use('/api/admin/secret-codes', adminSecretCodeRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
