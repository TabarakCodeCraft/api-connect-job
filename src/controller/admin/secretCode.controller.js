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
  if (!codeId) return res.status(400).json({ success: false, message: 'Invalid code ID' });
  try {
    const updated = await prisma.secretCode.update({
      where: { id: codeId },
      data: {
        isUsed: true,
        expiresAt: new Date(),
      },
    });
    res.status(200).json({ success: true, secretCode: updated });
  } catch (error) {
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