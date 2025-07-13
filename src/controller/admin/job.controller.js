const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// جلب كل الوظائف
exports.getAllJobs = async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      include: { company: true }
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
};

// جلب تفاصيل وظيفة واحدة
exports.getJobById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true }
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

// حذف وظيفة
exports.deleteJob = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.job.delete({ where: { id } });
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 