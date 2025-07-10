const express = require('express');
const {
  getCompanyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../../controller/company/notification.controller');
const { authenticateToken, authorizeCompany } = require('../../middleware/auth');

const router = express.Router();

// Get all company notifications
router.get('/', authenticateToken, authorizeCompany, getCompanyNotifications);

// Mark notification as read
router.put('/:id/read', authenticateToken, authorizeCompany, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, authorizeCompany, markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', authenticateToken, authorizeCompany, deleteNotification);

module.exports = router; 