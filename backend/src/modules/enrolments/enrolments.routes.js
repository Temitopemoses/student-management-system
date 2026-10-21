import { Router } from 'express';
import { EnrolmentController } from './enrolments.controller.js';
import {
  enrolStudentSchema,
  updateEnrolmentSchema,
  withdrawSchema,
  enrolmentQuerySchema,
} from './enrolments.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';

const router = Router();

// Staff authentication required for all enrolment routes
router.use(authenticate);

// View enrolments
router.get('/', validate(enrolmentQuerySchema, 'query'), EnrolmentController.getEnrolments);

// Enrolment mutations (Restricted to Administrator role)
router.post('/', requireRole('ADMIN'), validate(enrolStudentSchema, 'body'), EnrolmentController.enrolStudent);
router.patch('/:id', requireRole('ADMIN'), validate(updateEnrolmentSchema, 'body'), EnrolmentController.updateEnrolment);
router.post('/:id/withdraw', requireRole('ADMIN'), validate(withdrawSchema, 'body'), EnrolmentController.withdrawStudent);

export default router;
