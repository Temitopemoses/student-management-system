import { Router } from 'express';
import { StudentController } from './students.controller.js';
import { createStudentSchema, updateStudentSchema, studentQuerySchema } from './students.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// All student routes require an authenticated staff member
router.use(authenticate);

// View students (Accessible to both Administrators and Instructors)
router.get('/', validate(studentQuerySchema, 'query'), StudentController.getStudents);
router.get('/:id', StudentController.getStudentById);

// Administrative operations (Restricted strictly to Administrator role)
router.post('/', requireRole('ADMIN'), validate(createStudentSchema, 'body'), StudentController.createStudent);
router.patch('/:id', requireRole('ADMIN'), validate(updateStudentSchema, 'body'), StudentController.updateStudent);
router.delete('/:id', requireRole('ADMIN'), StudentController.archiveStudent);

export default router;
