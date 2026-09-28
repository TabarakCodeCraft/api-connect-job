const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getEmployeeNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const employeeId = req.user?.employeeId;

    if (!userId || !employeeId) {
      return res.status(401).json({
        success: false,
        message: 'Employee not authenticated',
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const jobMatches = await prisma.jobMatch.findMany({
      where: {
        employeeId: employeeId,
        OR: [
          { matchRate: { gte: 25 } },
        ],
      },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    const orConditions = [];
    if (employee.governorate) {
      orConditions.push({ governorate: employee.governorate });
    }
    if (employee.jobTitle) {
      orConditions.push({ jobTitle: employee.jobTitle });
    }
    let extraJobs = [];
    if (orConditions.length > 0) {
      extraJobs = await prisma.job.findMany({
        where: {
          OR: orConditions,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const jobNotifications = jobMatches.map(match => ({
      id: `jobmatch-${match.id}`,
      title: 'وظيفة متناسبة مع ملفك',
      message: `هناك وظيفة متناسبة مع ملفك الشخصي: ${match.job.jobTitle} بنسبة تشابه ${match.matchRate.toFixed(0)}%`,
      createdAt: match.createdAt,
      isRead: false,
      type: 'jobmatch',
      job: match.job,
    }));

    const extraJobNotifications = extraJobs
      .filter(job => !jobMatches.some(match => match.jobId === job.id))
      .map(job => ({
        id: `extrajob-${job.id}`,
        title: 'وظيفة في نفس محافظتك أو تخصصك',
        message: `تم نشر وظيفة جديدة (${job.jobTitle}) في نفس محافظتك أو تخصصك`,
        createdAt: job.createdAt,
        isRead: false,
        type: 'extrajob',
        job,
      }));

    const allNotifications = [
      ...notifications,
      ...jobNotifications,
      ...extraJobNotifications,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: allNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Employee not authenticated',
      });
    }

    const notification = await prisma.notification.update({
      where: { 
        id: parseInt(id),
        userId: userId,
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

const markAllNotificationsAsRead = async (req, res, next) => {
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Employee not authenticated',
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId: userId,
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

const deleteNotification = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Employee not authenticated',
      });
    }

    await prisma.notification.delete({
      where: { 
        id: parseInt(id),
        userId: userId,
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
  getEmployeeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
}; 
