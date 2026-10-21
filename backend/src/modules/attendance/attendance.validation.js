import { z } from 'zod';

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  courseId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const recordBatchAttendanceSchema = z.object({
  courseId: z.string({ required_error: 'Course ID is required' }).uuid('Invalid course ID'),
  date: z.coerce.date({ required_error: 'Attendance date is required' }),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid('Invalid student ID'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        notes: z.string().trim().max(255).optional().or(z.literal('')),
      })
    )
    .min(1, 'At least one attendance record must be provided'),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
  notes: z.string().trim().max(255).optional().or(z.literal('')),
});
