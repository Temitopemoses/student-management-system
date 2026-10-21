import { config } from '../config/index.js';

/**
 * Custom application error class for domain & operational errors.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error-handling middleware for Express.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  const response = {
    success: false,
    message,
    code,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  // Include stack trace only in non-production environments
  if (!config.isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
