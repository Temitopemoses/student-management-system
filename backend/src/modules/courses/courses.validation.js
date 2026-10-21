import { z } from 'zod';

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  instructorId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'code', 'title', 'startDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createCourseSchema = z
  .object({
    code: z
      .string({ required_error: 'Course code is required' })
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .max(20, 'Code cannot exceed 20 characters')
      .toUpperCase(),
    title: z
      .string({ required_error: 'Course title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().optional().or(z.literal('')),
    instructorId: z.string().uuid('Invalid instructor ID').optional().or(z.literal('')),
    startDate: z.coerce.date({ required_error: 'Start date is required' }),
    endDate: z.coerce.date().optional(),
    capacity: z.coerce.number().int().positive('Capacity must be a positive number').optional().or(z.literal('')),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );

export const updateCourseSchema = z
  .object({
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().optional().or(z.literal('')),
    instructorId: z.string().uuid().optional().or(z.literal('')),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    capacity: z.coerce.number().int().positive().optional().or(z.literal('')),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );
