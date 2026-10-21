import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class EnrolmentService {
  /**
   * Fetch enrolments with filtering and pagination
   */
  static async getEnrolments({ page = 1, limit = 10, courseId, studentId, status }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const [enrolments, total] = await Promise.all([
      prisma.enrolment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          student: {
            select: { id: true, studentNumber: true, firstName: true, lastName: true, email: true },
          },
          course: {
            select: { id: true, code: true, title: true, status: true },
          },
        },
      }),
      prisma.enrolment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      enrolments,
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
   * Enrol a student into a course inside a database transaction with capacity verification
   */
  static async enrolStudent({ studentId, courseId, notes }, actingUserId, ipAddress = null) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify student exists and is ACTIVE
      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!student) {
        throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
      }
      if (student.status !== 'ACTIVE') {
        throw new AppError(
          `Cannot enrol student with status '${student.status}'. Student must be ACTIVE.`,
          400,
          'STUDENT_NOT_ACTIVE'
        );
      }

      // 2. Verify course exists and is ACTIVE
      const course = await tx.course.findUnique({
        where: { id: courseId },
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
        throw new AppError('Course not found.', 404, 'COURSE_NOT_FOUND');
      }
      if (course.status !== 'ACTIVE') {
        throw new AppError(
          `Cannot enrol into course '${course.code}' because course status is '${course.status}'. Course must be ACTIVE.`,
          400,
          'COURSE_NOT_ACTIVE'
        );
      }

      // 3. Verify capacity limit
      if (course.capacity && course._count.enrolments >= course.capacity) {
        throw new AppError(
          `Course '${course.code}' has reached its maximum capacity of ${course.capacity} students.`,
          409,
          'COURSE_CAPACITY_FULL'
        );
      }

      // 4. Check for existing enrolment
      const existingEnrolment = await tx.enrolment.findUnique({
        where: {
          studentId_courseId: { studentId, courseId },
        },
      });

      if (existingEnrolment) {
        if (existingEnrolment.status === 'ENROLLED') {
          throw new AppError(
            `Student '${student.studentNumber}' is already actively enrolled in course '${course.code}'.`,
            409,
            'DUPLICATE_ENROLMENT'
          );
        }
        // If previously withdrawn or completed, reactivate enrolment
        const reEnrolled = await tx.enrolment.update({
          where: { id: existingEnrolment.id },
          data: {
            status: 'ENROLLED',
            enrolledAt: new Date(),
            notes: notes ? notes.trim() : existingEnrolment.notes,
          },
          include: {
            student: { select: { studentNumber: true, firstName: true, lastName: true } },
            course: { select: { code: true, title: true } },
          },
        });

        await tx.activityLog.create({
          data: {
            userId: actingUserId,
            action: 'ENROLMENT_REACTIVATE',
            entityType: 'Enrolment',
            entityId: reEnrolled.id,
            ipAddress,
            metadata: {
              studentNumber: student.studentNumber,
              courseCode: course.code,
            },
          },
        });

        return reEnrolled;
      }

      // 5. Create new enrolment
      const newEnrolment = await tx.enrolment.create({
        data: {
          studentId,
          courseId,
          status: 'ENROLLED',
          notes: notes ? notes.trim() : null,
        },
        include: {
          student: { select: { studentNumber: true, firstName: true, lastName: true } },
          course: { select: { code: true, title: true } },
        },
      });

      // 6. Audit Log
      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'ENROLMENT_CREATE',
          entityType: 'Enrolment',
          entityId: newEnrolment.id,
          ipAddress,
          metadata: {
            studentNumber: student.studentNumber,
            courseCode: course.code,
          },
        },
      });

      return newEnrolment;
    });

    return result;
  }

  /**
   * Update enrolment status or notes
   */
  static async updateEnrolment(id, data, actingUserId, ipAddress = null) {
    const enrolment = await prisma.enrolment.findUnique({ where: { id } });
    if (!enrolment) {
      throw new AppError('Enrolment record not found.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.enrolment.update({
        where: { id },
        data: {
          status: data.status || undefined,
          notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : undefined,
        },
        include: {
          student: { select: { studentNumber: true, firstName: true, lastName: true } },
          course: { select: { code: true, title: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'ENROLMENT_UPDATE',
          entityType: 'Enrolment',
          entityId: id,
          ipAddress,
          metadata: { newStatus: result.status },
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Withdraw student from a course without deleting records
   */
  static async withdrawStudent(id, { notes }, actingUserId, ipAddress = null) {
    const enrolment = await prisma.enrolment.findUnique({
      where: { id },
      include: {
        student: { select: { studentNumber: true, firstName: true, lastName: true } },
        course: { select: { code: true } },
      },
    });

    if (!enrolment) {
      throw new AppError('Enrolment record not found.', 404, 'NOT_FOUND');
    }

    if (enrolment.status === 'WITHDRAWN') {
      throw new AppError('Student is already marked as withdrawn from this course.', 400, 'ALREADY_WITHDRAWN');
    }

    const withdrawn = await prisma.$transaction(async (tx) => {
      const result = await tx.enrolment.update({
        where: { id },
        data: {
          status: 'WITHDRAWN',
          notes: notes ? notes.trim() : enrolment.notes,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'ENROLMENT_WITHDRAW',
          entityType: 'Enrolment',
          entityId: id,
          ipAddress,
          metadata: {
            studentNumber: enrolment.student.studentNumber,
            courseCode: enrolment.course.code,
            reason: notes || 'No reason specified',
          },
        },
      });

      return result;
    });

    return withdrawn;
  }
}
