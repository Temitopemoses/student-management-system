import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CourseService {
  /**
   * Fetch courses with search, filtering, pagination, and active enrolment counts
   */
  static async getCourses({ page = 1, limit = 10, search, status, instructorId, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: {
              enrolments: {
                where: { status: 'ENROLLED' },
              },
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      courses,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Fetch single course details with enrolled students roster
   */
  static async getCourseById(id) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        enrolments: {
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found.', 404, 'NOT_FOUND');
    }

    const activeEnrolmentsCount = course.enrolments.filter((e) => e.status === 'ENROLLED').length;
    const isFull = course.capacity ? activeEnrolmentsCount >= course.capacity : false;

    return {
      ...course,
      activeEnrolmentsCount,
      isFull,
      availableSeats: course.capacity ? Math.max(0, course.capacity - activeEnrolmentsCount) : null,
    };
  }

  /**
   * Create a new course
   */
  static async createCourse(data, actingUserId, ipAddress = null) {
    const code = data.code.trim().toUpperCase();

    const existingCode = await prisma.course.findUnique({ where: { code } });
    if (existingCode) {
      throw new AppError(`A course with code '${code}' already exists.`, 409, 'COURSE_CODE_EXISTS');
    }

    const instructorId = data.instructorId && data.instructorId.trim() !== '' ? data.instructorId : null;
    if (instructorId) {
      const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
      if (!instructor || instructor.role !== 'INSTRUCTOR') {
        throw new AppError('Assigned user is not an active instructor.', 400, 'INVALID_INSTRUCTOR');
      }
    }

    const capacity = data.capacity ? parseInt(data.capacity, 10) : null;

    const course = await prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          code,
          title: data.title.trim(),
          description: data.description ? data.description.trim() : null,
          instructorId,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          capacity,
          status: data.status || 'DRAFT',
        },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'COURSE_CREATE',
          entityType: 'Course',
          entityId: created.id,
          ipAddress,
          metadata: { code: created.code, title: created.title },
        },
      });

      return created;
    });

    return course;
  }

  /**
   * Update existing course
   */
  static async updateCourse(id, data, actingUserId, ipAddress = null) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new AppError('Course not found.', 404, 'NOT_FOUND');
    }

    let code = course.code;
    if (data.code && data.code.trim().toUpperCase() !== course.code) {
      code = data.code.trim().toUpperCase();
      const existing = await prisma.course.findUnique({ where: { code } });
      if (existing && existing.id !== id) {
        throw new AppError(`A course with code '${code}' already exists.`, 409, 'COURSE_CODE_EXISTS');
      }
    }

    let instructorId = course.instructorId;
    if (data.instructorId !== undefined) {
      instructorId = data.instructorId && data.instructorId.trim() !== '' ? data.instructorId : null;
      if (instructorId) {
        const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
        if (!instructor || instructor.role !== 'INSTRUCTOR') {
          throw new AppError('Assigned user is not an active instructor.', 400, 'INVALID_INSTRUCTOR');
        }
      }
    }

    const startDate = data.startDate ? new Date(data.startDate) : course.startDate;
    const endDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : course.endDate;

    if (endDate && endDate < startDate) {
      throw new AppError('End date cannot be earlier than start date.', 422, 'INVALID_DATE_RANGE');
    }

    const capacity = data.capacity !== undefined ? (data.capacity ? parseInt(data.capacity, 10) : null) : course.capacity;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.course.update({
        where: { id },
        data: {
          code,
          title: data.title ? data.title.trim() : undefined,
          description: data.description !== undefined ? (data.description ? data.description.trim() : null) : undefined,
          instructorId,
          startDate,
          endDate,
          capacity,
          status: data.status || undefined,
        },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'COURSE_UPDATE',
          entityType: 'Course',
          entityId: id,
          ipAddress,
          metadata: { updatedFields: Object.keys(data) },
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Safely archive a course (Prevents archiving if active enrolments exist)
   */
  static async archiveCourse(id, actingUserId, ipAddress = null) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrolments: {
              where: { status: 'ENROLLED' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found.', 404, 'NOT_FOUND');
    }

    if (course.status === 'ARCHIVED') {
      throw new AppError('Course is already archived.', 400, 'ALREADY_ARCHIVED');
    }

    // Business rule: Enforce that courses with active enrolments cannot be archived
    if (course._count.enrolments > 0) {
      throw new AppError(
        `Cannot archive course '${course.code}' because it currently has ${course._count.enrolments} active enrolment(s). Please complete or withdraw all enrolments before archiving.`,
        400,
        'ACTIVE_ENROLMENTS_EXIST'
      );
    }

    const archived = await prisma.$transaction(async (tx) => {
      const result = await tx.course.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'COURSE_ARCHIVE',
          entityType: 'Course',
          entityId: id,
          ipAddress,
          metadata: { code: course.code },
        },
      });

      return result;
    });

    return archived;
  }
}
