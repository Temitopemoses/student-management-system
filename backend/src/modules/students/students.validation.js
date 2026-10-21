import { z } from 'zod';

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  sortBy: z.enum(['createdAt', 'studentNumber', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createStudentSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }).trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string({ required_error: 'Last name is required' }).trim().min(2, 'Last name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
  profileImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const updateStudentSchema = createStudentSchema.partial();
