const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllCompanies = async (req, res, next) => {
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

    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          secretCodes: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prisma.company.count({ where }),
    ]);

    const companiesWithSecretCode = companies.map(company => ({
      ...company,
      secretCode: company.secretCodes[0]?.code || null
    }));
    res.status(200).json({
      data: companiesWithSecretCode,
      totalCount,
      page,
      pageSize
    });
  } catch (error) {
    next(error);
  }
};

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.generateSecretCode = async (req, res, next) => {
  const companyId = parseInt(req.params.id);
  if (!companyId) return res.status(400).json({ success: false, message: 'Invalid company ID' });
  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateRandomCode();
      const existing = await prisma.secretCode.findUnique({ where: { code } });
      if (!existing) isUnique = true;
    }

    const secretCode = await prisma.secretCode.create({
      data: {
        code,
        companyId: company.id,
        createdById: req.user?.id || 1,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
      }
    });

    res.status(200).json({ success: true, secretCode: secretCode.code });
  } catch (error) {
    next(error);
  }
}; 
