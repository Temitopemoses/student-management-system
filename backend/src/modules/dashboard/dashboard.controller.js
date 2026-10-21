import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await DashboardService.getStats(req.user);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const activities = await DashboardService.getRecentActivity(limit);
      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }
}
