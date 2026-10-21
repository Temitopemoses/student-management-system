import { AttendanceService } from './attendance.service.js';

export class AttendanceController {
  static async getAttendance(req, res, next) {
    try {
      const result = await AttendanceService.getAttendance(req.query, req.user);
      res.status(200).json({
        success: true,
        data: result.records,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseAttendanceByDate(req, res, next) {
    try {
      const { courseId } = req.params;
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      const result = await AttendanceService.getCourseAttendanceByDate(courseId, targetDate, req.user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordBatchAttendance(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const records = await AttendanceService.recordBatchAttendance(req.body, req.user, ipAddress);
      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully.',
        data: { count: records.length },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAttendance(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const record = await AttendanceService.updateAttendance(req.params.id, req.body, req.user, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Attendance record updated successfully.',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}
