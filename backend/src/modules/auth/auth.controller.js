import { AuthService } from './auth.service.js';
import { config } from '../../config/index.js';

// Cookie configuration options
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript document.cookie access (Mitigates XSS)
  secure: config.isProduction, // HTTPS only in production
  sameSite: 'lax', // Protects against CSRF while allowing smooth client navigation
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export class AuthController {
  /**
   * User login handler
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { token, user } = await AuthService.login(email, password, ipAddress);

      // Attach HTTP-only session cookie
      res.cookie(config.jwt.cookieName, token, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout handler
   */
  static async logout(req, res, next) {
    try {
      // Clear HTTP-only session cookie
      res.clearCookie(config.jwt.cookieName, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current authenticated user
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
