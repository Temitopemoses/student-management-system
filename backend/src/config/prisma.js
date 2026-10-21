import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

/**
 * Singleton instance of the PrismaClient.
 * In development, we log queries and errors to assist debugging.
 */
const prisma = new PrismaClient({
  log: config.isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
