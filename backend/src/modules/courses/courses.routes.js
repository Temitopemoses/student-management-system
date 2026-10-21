import { Router } from 'express';
import { CourseController } from './courses.controller.js';
import { createCourseSchema, updateCourseSchema, courseQuerySchema } from './courses.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// Staff authentication required for all course endpoints
router.use(authenticate);

// View courses (Accessible to Admins and Instructors)
router.get('/', validate(courseQuerySchema, 'query'), CourseController.getCourses);
router.get('/:id', CourseController.getCourseById);

// Administrative operations (Restricted to Administrator role)
router.post('/', requireRole('ADMIN'), validate(createCourseSchema, 'body'), CourseController.createCourse);
router.patch('/:id', requireRole('ADMIN'), validate(updateCourseSchema, 'body'), CourseController.updateCourse);
router.delete('/:id', requireRole('ADMIN'), CourseController.archiveCourse);

export default router;
