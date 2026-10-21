import { CourseService } from './courses.service.js';

export class CourseController {
  static async getCourses(req, res, next) {
    try {
      const result = await CourseService.getCourses(req.query);
      res.status(200).json({
        success: true,
        data: result.courses,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseById(req, res, next) {
    try {
      const course = await CourseService.getCourseById(req.params.id);
      res.status(200).json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCourse(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const course = await CourseService.createCourse(req.body, req.user.id, ipAddress);
      res.status(201).json({
        success: true,
        message: 'Course created successfully.',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCourse(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const course = await CourseService.updateCourse(req.params.id, req.body, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Course updated successfully.',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  static async archiveCourse(req, res, next) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const course = await CourseService.archiveCourse(req.params.id, req.user.id, ipAddress);
      res.status(200).json({
        success: true,
        message: 'Course archived successfully.',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }
}
