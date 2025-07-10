const { PrismaClient } = require('@prisma/client');
const emailService = require('../../utils/emailService');
const prisma = new PrismaClient();

// Generate a random secret code
const generateSecretCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get all company requests
const getAllCompanyRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [companyRequests, totalCount] = await Promise.all([
      prisma.companyRequest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.companyRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: companyRequests,
      totalCount,
      page,
      pageSize
    });
  } catch (error) {
    next(error);
  }
};

// Get company request by ID
const getCompanyRequestById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const companyRequest = await prisma.companyRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!companyRequest) {
      return res.status(404).json({
        success: false,
        message: 'طلب الشركة غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      data: companyRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Approve company request
const approveCompanyRequest = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Get the company request
    const companyRequest = await prisma.companyRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!companyRequest) {
      return res.status(404).json({
        success: false,
        message: 'طلب الشركة غير موجود',
      });
    }

    if (companyRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'تم معالجة طلب الشركة مسبقاً',
      });
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { email: companyRequest.email },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'شركة بهذا البريد الإلكتروني موجودة مسبقاً',
      });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Company record from CompanyRequest data
      const company = await tx.company.create({
        data: {
          email: companyRequest.email,
          companyName: companyRequest.companyName,
          sector: companyRequest.sector,
          address: companyRequest.address,
          phone: companyRequest.phone,
          fullname: companyRequest.fullname,
          governorate: companyRequest.governorate,
          jobTitle: companyRequest.jobTitle,
        },
      });

      // 2. Generate a unique secret code
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = generateSecretCode();
        const existingCode = await tx.secretCode.findUnique({
          where: { code },
        });
        if (!existingCode) {
          isUnique = true;
        }
      }

      // 3. Create the SecretCode record
      const secretCode = await tx.secretCode.create({
        data: {
          code,
          companyId: company.id,
          createdById: req.user?.id || 1, // Assuming admin user ID from auth middleware
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
      });

      // 4. Update the CompanyRequest status
      await tx.companyRequest.update({
        where: { id: parseInt(id) },
        data: { status: 'APPROVED' },
      });

      // 5. Create notification for the company
      await tx.notification.create({
        data: {
          companyId: company.id,
          title: 'تمت الموافقة على التسجيل',
          message: `تمت الموافقة على تسجيل شركتك! الرقم السري الخاص بك هو: ${code}. يرجى الاحتفاظ بهذا الرقم للدخول.`,
        },
      });

      return { company, secretCode };
    });

    // Send email notification to company
    const emailResult = await emailService.sendCompanyApprovalNotification(
      {
        email: companyRequest.email,
        companyName: companyRequest.companyName,
        sector: companyRequest.sector,
        address: companyRequest.address,
        phone: companyRequest.phone,
        fullname: companyRequest.fullname,
        governorate: companyRequest.governorate,
        jobTitle: companyRequest.jobTitle,
      },
      result.secretCode.code
    );

    if (!emailResult.success) {
      console.error('Failed to send approval email notification:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'تمت الموافقة على طلب الشركة بنجاح',
      data: {
        company: result.company,
        secretCode: result.secretCode.code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reject company request
const rejectCompanyRequest = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    // Get the company request
    const companyRequest = await prisma.companyRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!companyRequest) {
      return res.status(404).json({
        success: false,
        message: 'طلب الشركة غير موجود',
      });
    }

    if (companyRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'تم معالجة طلب الشركة مسبقاً',
      });
    }

    // Update the CompanyRequest status
    await prisma.companyRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'REJECTED' },
    });

    // Send email notification to company
    const emailResult = await emailService.sendCompanyRejectionNotification(
      {
        email: companyRequest.email,
        companyName: companyRequest.companyName,
        sector: companyRequest.sector,
        address: companyRequest.address,
        phone: companyRequest.phone,
        fullname: companyRequest.fullname,
        governorate: companyRequest.governorate,
        jobTitle: companyRequest.jobTitle,
      },
      reason
    );

    if (!emailResult.success) {
      console.error('Failed to send rejection email notification:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'تم رفض طلب الشركة بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

// Delete company request
const deleteCompanyRequest = async (req, res, next) => {
  const { id } = req.params;

  try {
    const companyRequest = await prisma.companyRequest.findUnique({
      where: { id: parseInt(id) },
    });

    if (!companyRequest) {
      return res.status(404).json({
        success: false,
        message: 'طلب الشركة غير موجود',
      });
    }

    await prisma.companyRequest.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'تم حذف طلب الشركة بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompanyRequests,
  getCompanyRequestById,
  approveCompanyRequest,
  rejectCompanyRequest,
  deleteCompanyRequest,
}; 