import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Staff authentication required for dashboard metrics
router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/recent-activity', DashboardController.getRecentActivity);

export default router;
