import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AuthService {
  /**
   * Authenticate a user with email and password
   */
  static async login(email, password, ipAddress = null) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Record login in activity log
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress,
          metadata: { email: user.email, role: user.role },
        },
      });
    } catch (logErr) {
      console.warn('[ActivityLog] Failed to log user login:', logErr.message);
    }

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Fetch current user profile details
   */
  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return user;
  }
}
