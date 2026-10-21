import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../config/prisma.js';
import { AppError } from './errorHandler.js';

/**
 * Authentication middleware.
 * Inspects HTTP-only cookies first, falling back to Authorization Bearer header.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[config.jwt.cookieName]) {
      token = req.cookies[config.jwt.cookieName];
    }
    // 2. Fallback to Authorization: Bearer <token> header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in to proceed.', 401, 'UNAUTHORIZED'));
    }

    // Verify JWT token signature and expiration
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verify user exists and is still active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(new AppError('The user belonging to this session no longer exists.', 401, 'UNAUTHORIZED'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact an administrator.', 403, 'FORBIDDEN'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};
