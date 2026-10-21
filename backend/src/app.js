import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/index.js';
import { AppError, errorHandler } from './middleware/errorHandler.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import studentRoutes from './modules/students/students.routes.js';
import courseRoutes from './modules/courses/courses.routes.js';
import enrolmentRoutes from './modules/enrolments/enrolments.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import userRoutes from './modules/users/users.routes.js';

const app = express();

// Security middleware - Helmet sets secure HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing setup
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true, // Allow cookies across origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging middleware in development
if (!config.isProduction) {
  app.use(morgan('dev'));
}

// Body parsing & Cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Base API route prefix
const API_PREFIX = '/api/v1';

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API is healthy and operational.',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
    },
  });
});

// Mount module routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
app.use(`${API_PREFIX}/enrolments`, enrolmentRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// Catch-all for unhandled routes
app.use('*', (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Centralized error handler
app.use(errorHandler);

export default app;
