import { AppError } from './errorHandler.js';

/**
 * Higher-order middleware function to validate incoming request data using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Target property on the request (default 'body')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace with validated and sanitized data
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const validationIssues = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(
          new AppError('Validation failed. Please check the supplied input.', 422, 'VALIDATION_ERROR', validationIssues)
        );
      }
      next(error);
    }
  };
};
