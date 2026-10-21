import prisma from '../../config/prisma.js';

export class DashboardService {
  /**
   * Calculate database-backed dashboard KPIs and metrics
   */
  static async getStats(user) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (user.role === 'ADMIN') {
      // Administrator: System-wide aggregated statistics
      const [
        totalActiveStudents,
        totalActiveCourses,
        totalActiveInstructors,
        totalCurrentEnrolments,
        recentAttendanceRecords,
        recentlyRegisteredStudents,
      ] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.course.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'INSTRUCTOR', isActive: true } }),
        prisma.enrolment.count({ where: { status: 'ENROLLED' } }),
        prisma.attendance.findMany({
          where: { date: { gte: thirtyDaysAgo } },
          select: { status: true },
        }),
        prisma.student.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      // Calculate 30-day attendance rate
      let present = 0;
      let late = 0;
      let absent = 0;
      let excused = 0;

      for (const rec of recentAttendanceRecords) {
        if (rec.status === 'PRESENT') present++;
        else if (rec.status === 'LATE') late++;
        else if (rec.status === 'ABSENT') absent++;
        else if (rec.status === 'EXCUSED') excused++;
      }

      const accountableSessions = present + late + absent;
      const attendancePercentage =
        accountableSessions > 0 ? Math.round(((present + late) / accountableSessions) * 100) : 100;

      return {
        role: 'ADMIN',
        kpis: {
          activeStudents: totalActiveStudents,
          activeCourses: totalActiveCourses,
          activeInstructors: totalActiveInstructors,
          currentEnrolments: totalCurrentEnrolments,
          attendanceRate30Days: attendancePercentage,
          attendanceSessionsCount: recentAttendanceRecords.length,
        },
        recentlyRegisteredStudents,
      };
    } else {
      // Instructor: Scoped to their assigned courses and enrolled students
      const [assignedCourses, myEnrolments, myAttendanceRecords] = await Promise.all([
        prisma.course.findMany({
          where: { instructorId: user.id, status: 'ACTIVE' },
          select: { id: true },
        }),
        prisma.enrolment.findMany({
          where: {
            status: 'ENROLLED',
            course: { instructorId: user.id },
          },
          select: { studentId: true },
        }),
        prisma.attendance.findMany({
          where: {
            date: { gte: thirtyDaysAgo },
            course: { instructorId: user.id },
          },
          select: { status: true },
        }),
      ]);

      const courseIds = assignedCourses.map((c) => c.id);
      const uniqueStudentIds = new Set(myEnrolments.map((e) => e.studentId));

      let present = 0;
      let late = 0;
      let absent = 0;
      for (const rec of myAttendanceRecords) {
        if (rec.status === 'PRESENT') present++;
        else if (rec.status === 'LATE') late++;
        else if (rec.status === 'ABSENT') absent++;
      }

      const accountableSessions = present + late + absent;
      const attendancePercentage =
        accountableSessions > 0 ? Math.round(((present + late) / accountableSessions) * 100) : 100;

      return {
        role: 'INSTRUCTOR',
        kpis: {
          activeStudents: uniqueStudentIds.size,
          activeCourses: courseIds.length,
          activeInstructors: 1,
          currentEnrolments: myEnrolments.length,
          attendanceRate30Days: attendancePercentage,
          attendanceSessionsCount: myAttendanceRecords.length,
        },
        recentlyRegisteredStudents: [],
      };
    }
  }

  /**
   * Fetch recent activity history
   */
  static async getRecentActivity(limit = 10) {
    const activities = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, role: true, email: true },
        },
      },
    });

    return activities;
  }
}
