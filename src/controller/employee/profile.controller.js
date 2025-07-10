const { PrismaClient, Governorate, JobTitle, LineOfWork } = require('@prisma/client');
const { createError } = require('../../utils/errorHandler');
const { getFileUrl, deleteFile } = require('../../utils/fileUpload');

const prisma = new PrismaClient();

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findFirst({
      where: { userId },
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
      throw createError(404, 'Employee profile not found');
    }

    res.status(200).json({
      success: true,
      data: {
        id: employee.id,
        username: employee.user.username,
        fullName: employee.fullName,
        email: employee.user.email,
        phone: employee.phone,
        gender: employee.gender,
        birthDate: employee.birthDate,
        bio: employee.bio,
        cvUrl: employee.cvUrl,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
        educations: employee.educations || [],
        experiences: employee.experiences || [],
        governorate: employee.governorate,
        jobTitle: employee.jobTitle,
        location: employee.location
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update employee profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      username,
      fullName,
      phone,
      gender,
      birthDate,
      bio,
      governorate,
      jobTitle,
      educations,
      experiences,
      location
    } = req.body;

    console.log('Profile update request:', {
      userId,
      body: req.body
    });

    // Find employee
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: { user: true }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    console.log('Found employee:', employee.id);

    // Update user data if username provided
    if (username) {
      await prisma.user.update({
        where: { id: userId },
        data: { username }
      });
    }

    // Process educations if provided
    let processedEducations = employee.educations;
    if (educations && Array.isArray(educations)) {
      processedEducations = educations.map(edu => ({
        id: edu.id || Date.now() + Math.random(), // Generate ID if not provided
        institution: edu.institution,
        degree: edu.degree,
        duration: edu.duration,
        description: edu.description,
        createdAt: edu.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    // Process experiences if provided
    let processedExperiences = employee.experiences;
    if (experiences && Array.isArray(experiences)) {
      processedExperiences = experiences.map(exp => ({
        id: exp.id || Date.now() + Math.random(), // Generate ID if not provided
        company: exp.company,
        position: exp.position,
        lineOfWork: exp.lineOfWork,
        duration: exp.duration,
        description: exp.description,
        createdAt: exp.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    // Update employee data
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        fullName: fullName || employee.fullName,
        phone: phone || employee.phone,
        gender: gender || employee.gender,
        birthDate: birthDate ? new Date(birthDate) : employee.birthDate,
        bio: bio || employee.bio,
        governorate: governorate || employee.governorate,
        jobTitle: jobTitle || employee.jobTitle,
        educations: processedEducations,
        experiences: processedExperiences,
        updatedAt: new Date(),
        location: location !== undefined ? location : employee.location
      },
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

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedEmployee.id,
        username: updatedEmployee.user.username,
        fullName: updatedEmployee.fullName,
        email: updatedEmployee.user.email,
        phone: updatedEmployee.phone,
        gender: updatedEmployee.gender,
        birthDate: updatedEmployee.birthDate,
        bio: updatedEmployee.bio,
        cvUrl: updatedEmployee.cvUrl,
        createdAt: updatedEmployee.createdAt,
        updatedAt: updatedEmployee.updatedAt,
        educations: updatedEmployee.educations || [],
        experiences: updatedEmployee.experiences || [],
        governorate: updatedEmployee.governorate,
        jobTitle: updatedEmployee.jobTitle,
        location: updatedEmployee.location
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
};

// Update CV with file upload
const updateCV = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    // Check if file was uploaded
    if (!req.file) {
      throw createError(400, 'CV file is required');
    }

    // Delete old CV file if exists
    if (employee.cvUrl) {
      const oldFilename = employee.cvUrl.split('/').pop();
      deleteFile(oldFilename);
    }

    // Get file URL
    const cvUrl = getFileUrl(req.file.filename);

    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        cvUrl,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'CV uploaded successfully',
      data: {
        cvUrl: updatedEmployee.cvUrl,
        filename: req.file.filename,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add education
const addEducation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { institution, degree, duration, description, startDate, endDate } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    // Get current educations or initialize empty array
    const currentEducations = employee.educations || [];

    // Create new education object with unique ID
    const newEducation = {
      id: Date.now(), // Simple ID generation, you can use uuid if preferred
      institution,
      degree,
      duration,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add new education to array
    const updatedEducations = [...currentEducations, newEducation];

    // Update employee with new educations array
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        educations: updatedEducations,
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Education added successfully',
      data: newEducation
    });
  } catch (error) {
    next(error);
  }
};

// Update education
const updateEducation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const educationId = parseInt(req.params.educationId);
    const { institution, degree, duration, description, startDate, endDate } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    const currentEducations = employee.educations || [];
    const educationIndex = currentEducations.findIndex(edu => edu.id === educationId);

    if (educationIndex === -1) {
      throw createError(404, 'Education not found');
    }

    // Update the education object
    const updatedEducation = {
      ...currentEducations[educationIndex],
      institution: institution || currentEducations[educationIndex].institution,
      degree: degree || currentEducations[educationIndex].degree,
      duration: duration || currentEducations[educationIndex].duration,
      description: description || currentEducations[educationIndex].description,
      startDate: startDate !== undefined ? startDate : currentEducations[educationIndex].startDate || null,
      endDate: endDate !== undefined ? endDate : currentEducations[educationIndex].endDate || null,
      updatedAt: new Date().toISOString()
    };

    // Replace the education in array
    const updatedEducations = [...currentEducations];
    updatedEducations[educationIndex] = updatedEducation;

    // Update employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        educations: updatedEducations,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Education updated successfully',
      data: updatedEducation
    });
  } catch (error) {
    next(error);
  }
};

// Delete education
const deleteEducation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const educationId = parseInt(req.params.educationId);

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    const currentEducations = employee.educations || [];
    const educationExists = currentEducations.some(edu => edu.id === educationId);

    if (!educationExists) {
      throw createError(404, 'Education not found');
    }

    // Filter out the education to delete
    const updatedEducations = currentEducations.filter(edu => edu.id !== educationId);

    // Update employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        educations: updatedEducations,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Education deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add experience
const addExperience = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { company, position, lineOfWork, duration, description, startDate, endDate } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    // Get current experiences or initialize empty array
    const currentExperiences = employee.experiences || [];

    // Create new experience object
    const newExperience = {
      id: Date.now(), // Simple ID generation
      company,
      position,
      lineOfWork,
      duration,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add new experience to array
    const updatedExperiences = [...currentExperiences, newExperience];

    // Update employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        experiences: updatedExperiences,
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Experience added successfully',
      data: newExperience
    });
  } catch (error) {
    next(error);
  }
};

// Update experience
const updateExperience = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const experienceId = parseInt(req.params.experienceId);
    const { company, position, lineOfWork, duration, description, startDate, endDate } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    const currentExperiences = employee.experiences || [];
    const experienceIndex = currentExperiences.findIndex(exp => exp.id === experienceId);

    if (experienceIndex === -1) {
      throw createError(404, 'Experience not found');
    }

    // Update the experience object
    const updatedExperience = {
      ...currentExperiences[experienceIndex],
      company: company || currentExperiences[experienceIndex].company,
      position: position || currentExperiences[experienceIndex].position,
      lineOfWork: lineOfWork || currentExperiences[experienceIndex].lineOfWork,
      duration: duration || currentExperiences[experienceIndex].duration,
      description: description || currentExperiences[experienceIndex].description,
      startDate: startDate !== undefined ? startDate : currentExperiences[experienceIndex].startDate || null,
      endDate: endDate !== undefined ? endDate : currentExperiences[experienceIndex].endDate || null,
      updatedAt: new Date().toISOString()
    };

    // Replace the experience in array
    const updatedExperiences = [...currentExperiences];
    updatedExperiences[experienceIndex] = updatedExperience;

    // Update employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        experiences: updatedExperiences,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Experience updated successfully',
      data: updatedExperience
    });
  } catch (error) {
    next(error);
  }
};

// Delete experience
const deleteExperience = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const experienceId = parseInt(req.params.experienceId);

    const employee = await prisma.employee.findFirst({
      where: { userId }
    });

    if (!employee) {
      throw createError(404, 'Employee profile not found');
    }

    const currentExperiences = employee.experiences || [];
    const experienceExists = currentExperiences.some(exp => exp.id === experienceId);

    if (!experienceExists) {
      throw createError(404, 'Experience not found');
    }

    // Filter out the experience to delete
    const updatedExperiences = currentExperiences.filter(exp => exp.id !== experienceId);

    // Update employee
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        experiences: updatedExperiences,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all employees (public/company view) with filters
const getAllEmployeesPublic = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const search = req.query.search || '';
    const location = req.query.location;
    const jobTitle = req.query.jobTitle;
    const gender = req.query.gender;
    const lineOfWork = req.query.lineOfWork;
    const carOwnership = req.query.carOwnership;
    const specialization = req.query.specialization;
    const governorate = req.query.governorate;

    // Build filters
    let where = {};
    if (location && location !== 'undefined') where.location = location;
    if (jobTitle && jobTitle !== 'undefined') where.jobTitle = jobTitle;
    if (gender && gender !== 'undefined') where.gender = gender;
    if (carOwnership && carOwnership !== 'undefined') where.carOwnership = carOwnership;
    if (specialization && specialization !== 'undefined') where.specialization = specialization;
    if (governorate && governorate !== 'undefined') where.governorate = governorate;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Query employees
    let [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    // If lineOfWork filter is provided, filter in JS
    if (lineOfWork && lineOfWork !== 'undefined') {
      employees = employees.filter(emp =>
        Array.isArray(emp.experiences) && emp.experiences.some(exp => exp.lineOfWork === lineOfWork)
      );
      totalCount = employees.length;
    }

    res.status(200).json({
      data: employees,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    next(error);
  }
};

// Get unique filter values for employees
const getEmployeeFilterOptions = async (req, res, next) => {
  try {
    const [locations, governoratesDb, jobTitlesDb, genders, carOwnerships, specializations] = await Promise.all([
      prisma.employee.findMany({ distinct: ['location'], select: { location: true }, where: { location: { not: null } } }),
      prisma.employee.findMany({ distinct: ['governorate'], select: { governorate: true }, where: { governorate: { not: null } } }),
      prisma.employee.findMany({ distinct: ['jobTitle'], select: { jobTitle: true }, where: { jobTitle: { not: null } } }),
      prisma.employee.findMany({ distinct: ['gender'], select: { gender: true }, where: { gender: { not: null } } }),
      prisma.employee.findMany({ distinct: ['carOwnership'], select: { carOwnership: true }, where: { carOwnership: { not: null } } }),
      prisma.employee.findMany({ distinct: ['specialization'], select: { specialization: true }, where: { specialization: { not: null } } }),
    ]);
    // For lineOfWork, collect all unique values from experiences arrays
    const employees = await prisma.employee.findMany({ select: { experiences: true } });
    const lineOfWorkSet = new Set();
    employees.forEach(emp => {
      if (Array.isArray(emp.experiences)) {
        emp.experiences.forEach(exp => {
          if (exp.lineOfWork) lineOfWorkSet.add(exp.lineOfWork);
        });
      }
    });
    // Always include both 'YES' and 'NO' for carOwnership
    const carOwnershipOptions = Array.from(new Set([...carOwnerships.map(c => c.carOwnership).filter(Boolean), 'YES', 'NO']));

    // استخدم جميع القيم من الـ enum وليس فقط من قاعدة البيانات
    const allGovernorates = Object.values(Governorate);
    const allJobTitles = Object.values(JobTitle);
    const allLineOfWork = Object.values(LineOfWork);

    res.json({
      locations: locations.map(l => l.location).filter(Boolean),
      governorates: allGovernorates,
      jobTitles: allJobTitles,
      genders: genders.map(g => g.gender).filter(Boolean),
      carOwnerships: carOwnershipOptions,
      specializations: specializations.map(s => s.specialization).filter(Boolean),
      lineOfWork: allLineOfWork,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single employee by ID (public/company view)
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
};

// جلب الوظائف المتشابهة مع الموظف
const getMatchedJobs = async (req, res) => {
  try {
    const employeeId = req.user.employeeId; // يفترض أن الموظف مصادق عليه
    if (!employeeId) {
      return res.status(403).json({ error: 'غير مصرح' });
    }
    const matches = await prisma.jobMatch.findMany({
      where: { employeeId },
      include: {
        job: {
          include: { company: true }
        }
      },
      orderBy: { matchRate: 'desc' }
    });
    const jobs = matches.map(match => ({
      job: match.job,
      matchRate: match.matchRate
    }));
    res.json({ jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الوظائف المتشابهة' });
  }
};

// إحصائيات الموظفين حسب المحافظة والتخصص والمسمى الوظيفي
const getEmployeeStats = async (req, res, next) => {
  try {
    // حسب المحافظة
    const governorateCounts = await prisma.employee.groupBy({
      by: ['governorate'],
      _count: { governorate: true },
      where: { governorate: { not: null } },
    });
    // حسب التخصص
    const specializationCounts = await prisma.employee.groupBy({
      by: ['specialization'],
      _count: { specialization: true },
      where: { specialization: { not: null } },
    });
    // حسب المسمى الوظيفي
    const jobTitleCounts = await prisma.employee.groupBy({
      by: ['jobTitle'],
      _count: { jobTitle: true },
      where: { jobTitle: { not: null } },
    });
    // العدد الكلي
    const totalEmployees = await prisma.employee.count();
    res.json({
      governorate: governorateCounts.map(g => ({ name: g.governorate, value: g._count.governorate })),
      specialization: specializationCounts.map(s => ({ name: s.specialization, value: s._count.specialization })),
      jobTitle: jobTitleCounts.map(j => ({ name: j.jobTitle, value: j._count.jobTitle })),
      total: totalEmployees,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateCV,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  getAllEmployeesPublic,
  getEmployeeFilterOptions,
  getEmployeeById,
  getMatchedJobs,
  getEmployeeStats,
};