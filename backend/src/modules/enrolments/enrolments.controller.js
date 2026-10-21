import { EnrolmentService } from './enrolments.service.js';

export class EnrolmentController {
  static async getEnrolments(req, res, next) {
    try {
      const result = await EnrolmentService.getEnrolments(req.query);
      res.status(200).json({
        success: true,
        data: result.enrolments,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async enrolStudent(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const enrolment = await EnrolmentService.enrolStudent(req.body, req.user.id, ipAddress);
      res.status(201).json({
        success: true,
        message: 'Student enrolled successfully.',
        data: enrolment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEnrolment(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const enrolment = await EnrolmentService.updateEnrolment(req.params.id, req.body, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Enrolment updated successfully.',
        data: enrolment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async withdrawStudent(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const enrolment = await EnrolmentService.withdrawStudent(req.params.id, req.body, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Student withdrawn from course successfully.',
        data: enrolment,
      });
    } catch (error) {
      next(error);
    }
  }
}
