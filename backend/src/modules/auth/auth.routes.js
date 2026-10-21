import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller.js';
import { loginSchema } from './auth.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Rate limiting for sensitive login endpoint to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});

router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;
