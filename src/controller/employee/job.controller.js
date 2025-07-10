const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// حساب نسبة التشابه بين الموظف والوظيفة
function calculateMatch(employee, job) {
  let score = 0;
  let total = 0;

  // المسمى الوظيفي
  total++;
  if (employee.jobTitle && job.jobTitle && employee.jobTitle === job.jobTitle) score++;

  // المحافظة
  total++;
  if (employee.governorate && job.governorate && employee.governorate === job.governorate) score++;

  // التخصص
  total++;
  if (employee.specialization && job.specialization && employee.specialization === job.specialization) score++;

  // مجال العمل
  total++;
  if (employee.lineOfWork && job.lineOfWork && employee.lineOfWork === job.lineOfWork) score++;

  // الجنس
  total++;
  if (!job.gender || (employee.gender && job.gender === employee.gender)) score++;

  // امتلاك سيارة
  total++;
  if (!job.carOwnership || (employee.carOwnership && job.carOwnership === employee.carOwnership)) score++;

  // يمكن إضافة منطق أكثر للمتطلبات لاحقًا

  return (score / total) * 100;
}

const getMatchedJobs = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const jobs = await prisma.job.findMany({ 
      where: { isActive: true },
      include: { company: { select: { companyName: true, email: true, phone: true } } },
    });
    const matchedJobs = jobs
      .map(job => {
        const matchRate = calculateMatch(employee, job);
        return { ...job, matchRate };
      })
      .filter(job => job.matchRate >= 50)
      .sort((a, b) => b.matchRate - a.matchRate);

    res.json(matchedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMatchedJobs }; 