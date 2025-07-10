const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const emailService = require('../../utils/emailService');
const prisma = new PrismaClient();

const registerCompany = async (req, res, next) => {
  const {
    email,
    companyName,
    sector,
    address,
    phone,
    fullname,
    governorate,
    jobTitle,
  } = req.body;

  try {
    // Validate all required fields
    if (!email || !companyName || !sector || !address || !phone || !fullname || !governorate || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة',
      });
    }

    // Check if email already exists in CompanyRequest
    const existingRequest = await prisma.companyRequest.findFirst({
      where: { email },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'تم تقديم طلب تسجيل بهذا البريد الإلكتروني مسبقاً',
      });
    }

    // Check if email already exists in Company table
    const existingCompany = await prisma.company.findUnique({
      where: { email },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'شركة بهذا البريد الإلكتروني موجودة مسبقاً',
      });
    }

    // Create CompanyRequest with all company information
    const companyRequest = await prisma.companyRequest.create({
      data: {
        email,
        companyName,
        sector,
        address,
        phone,
        fullname,
        governorate,
        jobTitle,
        status: 'PENDING',
      },
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        title: 'طلب تسجيل شركة جديد',
        message: `شركة جديدة "${companyName}" تريد التسجيل. البريد الإلكتروني: ${email}، الهاتف: ${phone}`,
      },
    });

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@connectjobs.com';
    const emailResult = await emailService.sendCompanyRegistrationNotification(
      {
        email,
        companyName,
        sector,
        address,
        phone,
        fullname,
        governorate,
        jobTitle,
      },
      adminEmail
    );

    if (!emailResult.success) {
      console.error('Failed to send email notification:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: 'تم تقديم طلب التسجيل بنجاح. في انتظار موافقة الإدارة.',
      data: companyRequest,
    });
  } catch (error) {
    next(error);
  }
};

const generateCompanyTokens = (company) => {
  const accessToken = jwt.sign(
    {
      id: company.id,
      email: company.email,
      companyName: company.companyName,
      role: 'COMPANY',
      companyId: company.id,
      type: 'company',
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    {
      id: company.id,
      email: company.email,
      companyName: company.companyName,
      role: 'COMPANY',
      companyId: company.id,
      type: 'company',
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const loginCompany = async (req, res, next) => {
  const { email, secretCode } = req.body;

  if (!email || !secretCode) {
    return res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني والرقم السري مطلوبان',
    });
  }

  try {
    // 1. Find the company by email
    const company = await prisma.company.findUnique({
      where: { email },
    });

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'شركة غير مسجلة أو بريد إلكتروني غير صحيح',
      });
    }

    // 2. Find the secret code
    const secretCodeRecord = await prisma.secretCode.findFirst({
      where: {
        code: secretCode,
        companyId: company.id,
      },
    });

    if (!secretCodeRecord) {
      return res.status(401).json({
        success: false,
        message: 'الرقم السري غير صحيح',
      });
    }

    // 3. Check if code is expired
    if (secretCodeRecord.expiresAt && secretCodeRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'هذا الرقم السري منتهي الصلاحية',
      });
    }

    // 4. Increment usageCount (do not block unless you want to)
    await prisma.secretCode.update({
      where: { id: secretCodeRecord.id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    // 5. Generate tokens
    const { accessToken, refreshToken } = generateCompanyTokens(company);

    res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        accessToken,
        refreshToken,
        company: {
          id: company.id,
          email: company.email,
          companyName: company.companyName,
          sector: company.sector,
          governorate: company.governorate,
          jobTitle: company.jobTitle,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshTokenCompany = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const company = await prisma.company.findUnique({ where: { id: decoded.id } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const tokens = generateCompanyTokens(company);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  loginCompany,
  refreshTokenCompany,
}; 