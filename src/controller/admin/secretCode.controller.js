const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSecretCodes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const [secretCodes, totalCount] = await Promise.all([
      prisma.secretCode.findMany({
        include: { company: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.secretCode.count(),
    ]);

    res.status(200).json({
      data: secretCodes,
      totalCount,
      page,
      pageSize
    });
  } catch (error) {
    next(error);
  }
};

exports.expireSecretCode = async (req, res, next) => {
  const codeId = parseInt(req.params.id);
  const { days } = req.body || {};
  
  console.log('DEBUG: Request body:', req.body);
  console.log('DEBUG: Days received:', days);
  console.log('DEBUG: Code ID:', codeId);
  
  if (!codeId) return res.status(400).json({ success: false, message: 'Invalid code ID' });
  try {
    let expiresAt;
    if (days && !isNaN(days)) {
      const daysNum = Number(days);
      console.log('DEBUG: Days as number:', daysNum);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysNum);
      expiresAt.setHours(23, 59, 59, 999); // نهاية اليوم
      console.log('DEBUG: Calculated expiresAt:', expiresAt);
    } else {
      expiresAt = new Date();
      console.log('DEBUG: No days provided, using current date');
    }
    console.log('DEBUG: Final expiresAt to be saved:', expiresAt);
    const updated = await prisma.secretCode.update({
      where: { id: codeId },
      data: {
        isUsed: true,
        expiresAt,
      },
    });
    console.log('DEBUG: updated secretCode:', updated);
    res.status(200).json({ success: true, secretCode: updated });
  } catch (error) {
    console.error('DEBUG: Error in expireSecretCode:', error);
    next(error);
  }
};

exports.deleteSecretCode = async (req, res, next) => {
  const codeId = parseInt(req.params.id);
  if (!codeId) return res.status(400).json({ success: false, message: 'Invalid code ID' });
  try {
    await prisma.secretCode.delete({ where: { id: codeId } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Generate a random secret code
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

exports.generateUnassignedSecretCode = async (req, res, next) => {
  try {
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
        createdById: req.user?.id || 1,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });
    res.status(200).json({ success: true, secretCode });
  } catch (error) {
    next(error);
  }
}; 