const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all notifications for admin (notifications without userId or companyId)
const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: null,
        companyId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: null,
        companyId: null,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
}; 