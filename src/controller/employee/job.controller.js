const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateMatch(employee, job) {
  let score = 0;
  let total = 0;

  total++;
  if (employee.jobTitle && job.jobTitle && employee.jobTitle === job.jobTitle) score++;

  total++;
  if (employee.governorate && job.governorate && employee.governorate === job.governorate) score++;

  total++;
  if (employee.specialization && job.specialization && employee.specialization === job.specialization) score++;

  total++;
  if (employee.lineOfWork && job.lineOfWork && employee.lineOfWork === job.lineOfWork) score++;

  total++;
  if (!job.gender || (employee.gender && job.gender === employee.gender)) score++;

  total++;
  if (!job.carOwnership || (employee.carOwnership && job.carOwnership === employee.carOwnership)) score++;


  return (score / total) * 100;
}

const getMatchedJobs = async (req, res) => {
  try {
    console.log('User data from token:', req.user);
    
    const employeeId = req.user.employeeId;
    if (!employeeId) {
   
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          employee: true
        }
      });
      
      if (!user || !user.employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee profile not found. Please complete your profile first.' 
        });
      }
      
      req.user.employeeId = user.employee.id;
      console.log('Found employee ID from user lookup:', user.employee.id);
    }

    const employee = await prisma.employee.findUnique({ 
      where: { id: req.user.employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        }
      }
    });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: 'Employee profile not found. Please complete your profile first.' 
      });
    }

    console.log('Found employee:', employee.fullName);

    const jobs = await prisma.job.findMany({ 
      where: { isActive: true },
      include: { 
        company: { 
          select: { 
            companyName: true, 
            email: true, 
            phone: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${jobs.length} active jobs`);
    
    const allJobs = jobs.map(job => {
      const matchRate = calculateMatch(employee, job);
      return { ...job, matchRate };
    });

    const sortedJobs = allJobs.sort((a, b) => {
      if (b.matchRate !== a.matchRate) {
        return b.matchRate - a.matchRate;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    console.log(`Returning ${sortedJobs.length} jobs with match rates`);

    res.json({
      success: true,
      data: sortedJobs,
      totalJobs: sortedJobs.length,
      employeeProfile: {
        fullName: employee.fullName,
        jobTitle: employee.jobTitle,
        governorate: employee.governorate,
        specialization: employee.specialization
      }
    });
  } catch (err) {
    console.error('Error in getMatchedJobs:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error occurred while fetching jobs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { getMatchedJobs }; 
