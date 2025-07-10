const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createError } = require('../../utils/errorHandler');

const prisma = new PrismaClient();

const generateTokens = (user, employeeId) => {
  const accessToken = jwt.sign(
    { userId: user.id, employeeId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, employeeId, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw createError(409, 'Email already registered');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and employee
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: 'EMPLOYEE'
      }
    });

    const employee = await prisma.employee.create({
      data: { userId: user.id }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, employee.id);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
        employee: { id: employee.id },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with employee profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true
      }
    });

    if (!user) {
      throw createError(401, 'Invalid credentials');
    }

    // Check if user is an employee
    if (user.role !== 'EMPLOYEE') {
      throw createError(403, 'Access denied. Employee account required.');
    }

    // Check if account is active
    if (!user.isActive) {
      throw createError(403, 'Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError(401, 'Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user, user.employee?.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        employee: user.employee ? {
          id: user.employee.id,
          phone: user.employee.phone,
          gender: user.employee.gender,
          location: user.employee.location,
          bio: user.employee.bio
        } : null,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError(400, 'Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true }
    });

    if (!user || !user.isActive) {
      throw createError(404, 'User not found or account deactivated');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, user.employee?.id);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken
};