import prisma from '../../config/prisma.js';

export class UserService {
  /**
   * Fetch all active instructors for dropdowns and course assignments
   */
  static async getInstructors() {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return instructors;
  }
}
