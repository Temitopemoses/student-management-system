import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateStudentNumber } from '../../utils/studentNumber.js';

export class StudentService {
  /**
   * Fetch paginated list of students with filtering and sorting
   */
  static async getStudents({ page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query and total count in parallel
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { enrolments: true },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      students,
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
   * Get single student profile with enrolments, course details, and attendance statistics
   */
  static async getStudentById(id) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrolments: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
                instructor: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        attendances: {
          select: {
            id: true,
            courseId: true,
            date: true,
            status: true,
            notes: true,
          },
          orderBy: { date: 'desc' },
          take: 20, // Recent 20 attendance records
        },
      },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'NOT_FOUND');
    }

    // Calculate attendance statistics
    const allAttendance = await prisma.attendance.findMany({
      where: { studentId: id },
      select: { status: true },
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const record of allAttendance) {
      if (record.status === 'PRESENT') present++;
      else if (record.status === 'LATE') late++;
      else if (record.status === 'ABSENT') absent++;
      else if (record.status === 'EXCUSED') excused++;
    }

    const accountableSessions = present + late + absent;
    const attendancePercentage =
      accountableSessions > 0 ? Math.round(((present + late) / accountableSessions) * 100) : 100;

    return {
      ...student,
      attendanceStats: {
        totalRecorded: allAttendance.length,
        present,
        late,
        absent,
        excused,
        attendancePercentage,
      },
    };
  }

  /**
   * Register a new student within a database transaction
   */
  static async createStudent(data, actingUserId, ipAddress = null) {
    // Normalize optional email (null if empty string)
    const email = data.email && data.email.trim() !== '' ? data.email.trim().toLowerCase() : null;

    if (email) {
      const existingEmail = await prisma.student.findUnique({ where: { email } });
      if (existingEmail) {
        throw new AppError(`A student with email '${email}' already exists.`, 409, 'EMAIL_EXISTS');
      }
    }

    // Run creation inside a transaction to guarantee atomic student number generation
    const newStudent = await prisma.$transaction(async (tx) => {
      const studentNumber = await generateStudentNumber(tx);

      const created = await tx.student.create({
        data: {
          ...data,
          email,
          studentNumber,
          phone: data.phone || null,
          gender: data.gender || null,
          address: data.address || null,
          profileImageUrl: data.profileImageUrl || null,
        },
      });

      // Audit Log
      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'STUDENT_CREATE',
          entityType: 'Student',
          entityId: created.id,
          ipAddress,
          metadata: {
            studentNumber: created.studentNumber,
            fullName: `${created.firstName} ${created.lastName}`,
          },
        },
      });

      return created;
    });

    return newStudent;
  }

  /**
   * Update student details
   */
  static async updateStudent(id, data, actingUserId, ipAddress = null) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new AppError('Student not found.', 404, 'NOT_FOUND');
    }

    const email =
      data.email !== undefined
        ? data.email && data.email.trim() !== ''
          ? data.email.trim().toLowerCase()
          : null
        : student.email;

    if (email && email !== student.email) {
      const existingEmail = await prisma.student.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== id) {
        throw new AppError(`A student with email '${email}' already exists.`, 409, 'EMAIL_EXISTS');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.student.update({
        where: { id },
        data: {
          ...data,
          email,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'STUDENT_UPDATE',
          entityType: 'Student',
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
   * Safely archive a student record (Soft delete)
   */
  static async archiveStudent(id, actingUserId, ipAddress = null) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new AppError('Student not found.', 404, 'NOT_FOUND');
    }

    if (student.status === 'ARCHIVED') {
      throw new AppError('Student is already archived.', 400, 'ALREADY_ARCHIVED');
    }

    const archived = await prisma.$transaction(async (tx) => {
      const result = await tx.student.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      await tx.activityLog.create({
        data: {
          userId: actingUserId,
          action: 'STUDENT_ARCHIVE',
          entityType: 'Student',
          entityId: id,
          ipAddress,
          metadata: { studentNumber: student.studentNumber },
        },
      });

      return result;
    });

    return archived;
  }
}
