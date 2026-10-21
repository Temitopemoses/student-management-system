import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export class AttendanceService {
  /**
   * Helper to verify if the requesting user has permission to view/manage attendance for the course
   */
  static async verifyCourseAccess(courseId, user) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, code: true, instructorId: true, status: true },
    });

    if (!course) {
      throw new AppError('Course not found.', 404, 'COURSE_NOT_FOUND');
    }

    if (user.role === 'INSTRUCTOR' && course.instructorId !== user.id) {
      throw new AppError(
        'Access denied: You can only record or view attendance for courses assigned to you.',
        403,
        'COURSE_ACCESS_FORBIDDEN'
      );
    }

    return course;
  }

  /**
   * Normalize any Date object or ISO string to UTC Midnight Date for strict day uniqueness
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /**
   * Fetch attendance roster for a specific course and date
   */
  static async getCourseAttendanceByDate(courseId, dateInput, user) {
    const course = await this.verifyCourseAccess(courseId, user);
    const date = this.normalizeDate(dateInput);

    // 1. Get all active enrolments for the course
    const enrolments = await prisma.enrolment.findMany({
      where: {
        courseId,
        status: 'ENROLLED',
      },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        student: { lastName: 'asc' },
      },
    });

    // 2. Get existing attendance records on that date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        date,
      },
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach((att) => {
      attendanceMap.set(att.studentId, att);
    });

    // 3. Merge roster with recorded attendance
    const roster = enrolments.map((enrol) => {
      const existing = attendanceMap.get(enrol.studentId);
      return {
        studentId: enrol.student.id,
        studentNumber: enrol.student.studentNumber,
        firstName: enrol.student.firstName,
        lastName: enrol.student.lastName,
        email: enrol.student.email,
        attendanceId: existing?.id || null,
        status: existing?.status || null,
        notes: existing?.notes || '',
        recordedById: existing?.recordedById || null,
      };
    });

    return {
      courseId: course.id,
      courseCode: course.code,
      date,
      totalEnrolled: enrolments.length,
      roster,
    };
  }

  /**
   * Record or amend batch attendance for a course on a given date
   */
  static async recordBatchAttendance({ courseId, date: dateInput, records }, user, ipAddress = null) {
    const course = await this.verifyCourseAccess(courseId, user);
    const date = this.normalizeDate(dateInput);

    const savedRecords = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const rec of records) {
        // Enforce upsert to prevent duplicate records for [studentId, courseId, date]
        const saved = await tx.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: rec.studentId,
              courseId,
              date,
            },
          },
          update: {
            status: rec.status,
            notes: rec.notes ? rec.notes.trim() : null,
            recordedById: user.id,
          },
          create: {
            studentId: rec.studentId,
            courseId,
            date,
            status: rec.status,
            notes: rec.notes ? rec.notes.trim() : null,
            recordedById: user.id,
          },
        });
        results.push(saved);
      }

      // Audit Log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'ATTENDANCE_RECORD',
          entityType: 'Attendance',
          entityId: courseId,
          ipAddress,
          metadata: {
            courseCode: course.code,
            date: date.toISOString().split('T')[0],
            recordsCount: records.length,
          },
        },
      });

      return results;
    });

    return savedRecords;
  }

  /**
   * Query attendance with pagination and filter support
   */
  static async getAttendance({ page = 1, limit = 20, courseId, studentId, status, startDate, endDate }, user) {
    const skip = (page - 1) * limit;
    const where = {};

    // Role scoping: Instructors can only view records for courses assigned to them
    if (user.role === 'INSTRUCTOR') {
      where.course = { instructorId: user.id };
    }

    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = this.normalizeDate(startDate);
      if (endDate) where.date.lte = this.normalizeDate(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: { id: true, studentNumber: true, firstName: true, lastName: true },
          },
          course: {
            select: { id: true, code: true, title: true },
          },
          recordedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      records,
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
   * Amend an individual attendance record
   */
  static async updateAttendance(id, data, user, ipAddress = null) {
    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: {
        course: { select: { instructorId: true, code: true } },
      },
    });

    if (!existing) {
      throw new AppError('Attendance record not found.', 404, 'NOT_FOUND');
    }

    if (user.role === 'INSTRUCTOR' && existing.course.instructorId !== user.id) {
      throw new AppError('You are not authorized to correct attendance for this course.', 403, 'FORBIDDEN');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.attendance.update({
        where: { id },
        data: {
          status: data.status || undefined,
          notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : undefined,
          recordedById: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'ATTENDANCE_CORRECT',
          entityType: 'Attendance',
          entityId: id,
          ipAddress,
          metadata: {
            courseCode: existing.course.code,
            previousStatus: existing.status,
            newStatus: result.status,
          },
        },
      });

      return result;
    });

    return updated;
  }
}
