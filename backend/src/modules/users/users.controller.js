import { UserService } from './users.service.js';

export class UserController {
  static async getInstructors(req, res, next) {
    try {
      const instructors = await UserService.getInstructors();
      res.status(200).json({
        success: true,
        data: instructors,
      });
    } catch (error) {
      next(error);
    }
  }
}
