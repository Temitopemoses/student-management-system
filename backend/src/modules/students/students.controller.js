import { StudentService } from './students.service.js';

export class StudentController {
  static async getStudents(req, res, next) {
    try {
      const result = await StudentService.getStudents(req.query);
      res.status(200).json({
        success: true,
        data: result.students,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req, res, next) {
    try {
      const student = await StudentService.getStudentById(req.params.id);
      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const student = await StudentService.createStudent(req.body, req.user.id, ipAddress);
      res.status(201).json({
        success: true,
        message: 'Student registered successfully.',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const student = await StudentService.updateStudent(req.params.id, req.body, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Student updated successfully.',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archiveStudent(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const student = await StudentService.archiveStudent(req.params.id, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Student archived successfully.',
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }
}
