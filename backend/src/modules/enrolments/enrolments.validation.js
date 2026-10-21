import { z } from 'zod';

export const enrolmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  courseId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  status: z.enum(['ENROLLED', 'COMPLETED', 'WITHDRAWN']).optional(),
});

export const enrolStudentSchema = z.object({
  studentId: z.string({ required_error: 'Student ID is required' }).uuid('Invalid student ID'),
  courseId: z.string({ required_error: 'Course ID is required' }).uuid('Invalid course ID'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const updateEnrolmentSchema = z.object({
  status: z.enum(['ENROLLED', 'COMPLETED', 'WITHDRAWN']).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const withdrawSchema = z.object({
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
