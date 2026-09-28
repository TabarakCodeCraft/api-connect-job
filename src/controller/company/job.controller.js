const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createJob = async (req, res) => {
  try {
    console.log('Job create body:', req.body);
    const companyId = req.user.companyId;
    const {
      jobTitle,
      description,
      requirements,
      governorate,
      salary,
      lineOfWork,
      gender,
      carOwnership,
      specialization,
      contactEmail,
      contactPhone
    } = req.body;
    if (!jobTitle || !description || !requirements || !governorate || !salary || !specialization) {
      return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    }

    const job = await prisma.job.create({
      data: {
        companyId,
        jobTitle,
        description,
        requirements,
        governorate,
        salary,
        lineOfWork,
        gender,
        carOwnership,
        specialization,
        contactEmail,
        contactPhone
      },
    });

    const employees = await prisma.employee.findMany();
    for (const employee of employees) {
      let matchCount = 0;
      let total = 0;
      if (employee.jobTitle && job.jobTitle && employee.jobTitle === job.jobTitle) { matchCount++; } total++;
      if (employee.governorate && job.governorate && employee.governorate === job.governorate) { matchCount++; } total++;
      if (employee.specialization && job.specialization && employee.specialization === job.specialization) { matchCount++; } total++;
      if (employee.lineOfWork && job.lineOfWork && employee.lineOfWork === job.lineOfWork) { matchCount++; } total++;
      if (employee.gender && job.gender && (job.gender === '' || employee.gender === job.gender)) { matchCount++; } total++;
      if (employee.carOwnership && job.carOwnership && (job.carOwnership === '' || employee.carOwnership === job.carOwnership)) { matchCount++; } total++;
      const matchRate = (matchCount / total) * 100;
      if (matchRate >= 40) {
        await prisma.jobMatch.create({
          data: {
            jobId: job.id,
            employeeId: employee.id,
            matchRate,
          },
        });
        await prisma.notification.create({
          data: {
            userId: employee.userId,
            title: 'وظيفة جديدة متشابهة مع ملفك',
            message: `تم نشر وظيفة جديدة (${job.jobTitle}) وهناك نسبة تشابه ${matchRate.toFixed(0)}% مع ملفك الشخصي.`,
          },
        });
      }
    }

    res.status(201).json({ job, message: 'تم نشر الوظيفة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء نشر الوظيفة' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Access denied. Company role required.' });
    }
    const jobs = await prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الوظائف' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const job = await prisma.job.findFirst({
      where: { id: Number(req.params.id), companyId },
    });
    if (!job) return res.status(404).json({ error: 'الوظيفة غير موجودة' });
    res.json({ job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الوظيفة' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const jobId = Number(req.params.id);
    const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) return res.status(404).json({ error: 'الوظيفة غير موجودة' });
    const data = req.body;
    const updated = await prisma.job.update({ where: { id: jobId }, data });
    res.json({ job: updated, message: 'تم تحديث الوظيفة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الوظيفة' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const jobId = Number(req.params.id);
    const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
    if (!job) return res.status(404).json({ error: 'الوظيفة غير موجودة' });
    await prisma.job.delete({ where: { id: jobId } });
    res.json({ message: 'تم حذف الوظيفة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الوظيفة' });
  }
}; 
