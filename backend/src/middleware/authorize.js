import { AppError } from './errorHandler.js';

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * @param  {...string} allowedRoles - List of roles permitted to access the resource (e.g., 'ADMIN', 'INSTRUCTOR')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before authorization check.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' is not authorized to perform this operation.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};
