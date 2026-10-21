import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`[SMS-BACKEND] Server listening on http://localhost:${config.port}`);
  console.log(`[SMS-BACKEND] Environment: ${config.env}`);
  console.log(`[SMS-BACKEND] Health check available at: http://localhost:${config.port}/api/v1/health`);
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`[SMS-BACKEND] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('[SMS-BACKEND] HTTP server closed. Process terminating.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SMS-BACKEND] Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[SMS-BACKEND] Uncaught Exception thrown:', error);
  process.exit(1);
});
