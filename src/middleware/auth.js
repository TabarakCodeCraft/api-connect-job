// middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { createError } = require('../utils/errorHandler');

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError(401, 'Access token is required');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw createError(401, 'Token has expired');
        }
        throw createError(401, 'Invalid token');
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize employee role
 */
const authorizeEmployee = (req, res, next) => {
  try {
    if (req.user.role !== 'EMPLOYEE') {
      throw createError(403, 'Access denied. Employee role required.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize company role
 */
const authorizeCompany = (req, res, next) => {
  console.log('Decoded user in authorizeCompany:', req.user);
  if (req.user.role !== 'COMPANY') {
    throw createError(403, 'Access denied. Company role required.');
  }
  next();
};

/**
 * Middleware to authorize admin role
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

/**
 * Middleware to authorize multiple roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        employee: {
          select: {
            id: true
          }
        }
      }
    });

    req.user = user ? {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      employeeId: user.employee?.id
    } : null;

    next();

  } catch (error) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 */
const checkResourceOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params[resourceIdParam]);
      const userId = req.user.userId;

      // This is a generic check - you might need to customize based on your specific use case
      // For example, checking if an employee owns their profile, experience, education, etc.
      
      if (req.user.role === 'ADMIN') {
        return next(); // Admins can access all resources
      }

      // Add your specific ownership logic here
      // Example: Check if the employee profile belongs to the authenticated user
      if (req.route.path.includes('/profile')) {
        const employee = await prisma.employee.findFirst({
          where: {
            id: resourceId,
            userId: userId
          }
        });

        if (!employee) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.',
            code: 'RESOURCE_OWNERSHIP_REQUIRED'
          });
        }
      }

      next();

    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        code: 'AUTH_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeEmployee,
  authorizeCompany,
  authorizeAdmin,
  authorizeRoles,
  optionalAuth,
  checkResourceOwnership
};