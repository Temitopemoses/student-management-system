import { Router } from 'express';
import { UserController } from './users.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/instructors', UserController.getInstructors);

export default router;
