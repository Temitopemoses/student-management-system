import { Router } from 'express';
import { AttendanceController } from './attendance.controller.js';
import {
  attendanceQuerySchema,
  recordBatchAttendanceSchema,
  updateAttendanceSchema,
} from './attendance.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Staff authentication required for all attendance operations
router.use(authenticate);

// View attendance history
router.get('/', validate(attendanceQuerySchema, 'query'), AttendanceController.getAttendance);

// View course attendance sheet for a specific date
router.get('/course/:courseId', AttendanceController.getCourseAttendanceByDate);

// Batch record / submit attendance
router.post('/', validate(recordBatchAttendanceSchema, 'body'), AttendanceController.recordBatchAttendance);

// Correct individual record
router.patch('/:id', validate(updateAttendanceSchema, 'body'), AttendanceController.updateAttendance);

export default router;
