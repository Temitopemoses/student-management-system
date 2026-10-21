import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_key_minimum_32_characters_long',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.COOKIE_NAME || 'sms_session',
  },
};
