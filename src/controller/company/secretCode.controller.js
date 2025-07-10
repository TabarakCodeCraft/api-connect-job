const { PrismaClient } = require('@prisma/client');
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

// Create a new secret code
const createSecretCode = async (req, res, next) => {
  const { companyId, createdById, expiresAt } = req.body;

  // Ensure companyId is provided
  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "Company ID is required to create a secret code.",
    });
  }

  try {
    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found. Cannot create secret code.",
      });
    }

    // Generate a unique secret code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateSecretCode();
      const existingCode = await prisma.secretCode.findUnique({
        where: { code },
      });
      if (!existingCode) {
        isUnique = true;
      }
    }

    const secretCode = await prisma.secretCode.create({
      data: {
        code,
        companyId: companyId,
        createdById: createdById || 1, // Defaulting to admin 1 if not provided
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Secret code created and linked to company successfully",
      data: secretCode,
    });
  } catch (error) {
    next(error);
  }
};

// Get all secret codes
const getAllSecretCodes = async (req, res, next) => {
  try {
    const secretCodes = await prisma.secretCode.findMany({
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: secretCodes,
    });
  } catch (error) {
    next(error);
  }
};

// Get secret code by ID
const getSecretCodeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const secretCode = await prisma.secretCode.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    if (!secretCode) {
      return res.status(404).json({
        success: false,
        message: 'Secret code not found',
      });
    }

    res.status(200).json({
      success: true,
      data: secretCode,
    });
  } catch (error) {
    next(error);
  }
};

// Update secret code
const updateSecretCode = async (req, res, next) => {
  const { id } = req.params;
  const { companyId, expiresAt, isUsed } = req.body;

  try {
    const secretCode = await prisma.secretCode.update({
      where: { id: parseInt(id) },
      data: {
        companyId: companyId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isUsed: isUsed !== undefined ? isUsed : undefined,
        usedAt: isUsed ? new Date() : null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Secret code updated successfully',
      data: secretCode,
    });
  } catch (error) {
    next(error);
  }
};

// Delete secret code
const deleteSecretCode = async (req, res, next) => {
  const { id } = req.params;

  try {
    await prisma.secretCode.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Secret code deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get secret codes by company ID
const getSecretCodesByCompany = async (req, res, next) => {
  const { companyId } = req.params;

  try {
    const secretCodes = await prisma.secretCode.findMany({
      where: { companyId: parseInt(companyId) },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: secretCodes,
    });
  } catch (error) {
    next(error);
  }
};

// Expire the secret code for the current company
const expireSecretCodeForCurrentCompany = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Not authenticated as company' });
    }
    // Find the latest active secret code for this company
    const secretCode = await prisma.secretCode.findFirst({
      where: {
        companyId: companyId,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!secretCode) {
      return res.status(404).json({ success: false, message: 'No active secret code found' });
    }
    await prisma.secretCode.update({
      where: { id: secretCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        expiresAt: new Date(),
      },
    });
    res.status(200).json({ success: true, message: 'Secret code expired' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSecretCode,
  getAllSecretCodes,
  getSecretCodeById,
  updateSecretCode,
  deleteSecretCode,
  getSecretCodesByCompany,
  expireSecretCodeForCurrentCompany,
}; 