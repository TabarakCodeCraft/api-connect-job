const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all notifications for a specific company
const getCompanyNotifications = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company not authenticated',
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        companyId: companyId,
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
  const companyId = req.user?.companyId;

  try {
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company not authenticated',
      });
    }

    const notification = await prisma.notification.update({
      where: { 
        id: parseInt(id),
        companyId: companyId,
      },
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
  const companyId = req.user?.companyId;

  try {
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company not authenticated',
      });
    }

    await prisma.notification.updateMany({
      where: {
        companyId: companyId,
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
  const companyId = req.user?.companyId;

  try {
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company not authenticated',
      });
    }

    await prisma.notification.delete({
      where: { 
        id: parseInt(id),
        companyId: companyId,
      },
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
  getCompanyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
}; 