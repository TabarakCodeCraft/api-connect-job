const express = require('express');
const {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../../controller/admin/notification.controller');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth');

const router = express.Router();

// Get all admin notifications
router.get('/', authenticateToken, authorizeAdmin, getAdminNotifications);

// Mark notification as read
router.put('/:id/read', authenticateToken, authorizeAdmin, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, authorizeAdmin, markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', authenticateToken, authorizeAdmin, deleteNotification);

module.exports = router; 