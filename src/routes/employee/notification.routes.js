const express = require('express');
const {
  getEmployeeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../../controller/employee/notification.controller');
const { authenticateToken, authorizeEmployee } = require('../../middleware/auth');

const router = express.Router();

// Get all employee notifications
router.get('/', authenticateToken, authorizeEmployee, getEmployeeNotifications);

// Mark notification as read
router.put('/:id/read', authenticateToken, authorizeEmployee, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, authorizeEmployee, markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', authenticateToken, authorizeEmployee, deleteNotification);

module.exports = router; 