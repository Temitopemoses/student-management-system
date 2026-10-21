import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EnrolmentService } from '../src/modules/enrolments/enrolments.service.js';
import { AttendanceService } from '../src/modules/attendance/attendance.service.js';
import prisma from '../src/config/prisma.js';

describe('Domain Business Rules & Error Handling', () => {
  describe('Enrolment Domain Rules', () => {
    it('throws 404 STUDENT_NOT_FOUND when student record does not exist', async () => {
      const originalTx = prisma.$transaction;
      prisma.$transaction = async (fn) => {
        const mockTx = {
          student: { findUnique: async () => null },
        };
        return fn(mockTx);
      };

      try {
        await assert.rejects(
          async () => {
            await EnrolmentService.enrolStudent(
              { studentId: 'non-existent', courseId: 'course-1' },
              'admin-id'
            );
          },
          (err) => {
            assert.equal(err.statusCode, 404);
            assert.equal(err.code, 'STUDENT_NOT_FOUND');
            return true;
          }
        );
      } finally {
        prisma.$transaction = originalTx;
      }
    });

    it('throws 400 STUDENT_NOT_ACTIVE when attempting to enrol an inactive or archived student', async () => {
      const originalTx = prisma.$transaction;
      prisma.$transaction = async (fn) => {
        const mockTx = {
          student: { findUnique: async () => ({ id: 'stu-1', status: 'ARCHIVED' }) },
        };
        return fn(mockTx);
      };

      try {
        await assert.rejects(
          async () => {
            await EnrolmentService.enrolStudent(
              { studentId: 'stu-1', courseId: 'course-1' },
              'admin-id'
            );
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            assert.equal(err.code, 'STUDENT_NOT_ACTIVE');
            return true;
          }
        );
      } finally {
        prisma.$transaction = originalTx;
      }
    });

    it('throws 400 COURSE_NOT_ACTIVE when enrolling into a DRAFT or ARCHIVED course', async () => {
      const originalTx = prisma.$transaction;
      prisma.$transaction = async (fn) => {
        const mockTx = {
          student: { findUnique: async () => ({ id: 'stu-1', status: 'ACTIVE' }) },
          course: {
            findUnique: async () => ({
              id: 'c-1',
              code: 'CS101',
              status: 'DRAFT',
              _count: { enrolments: 0 },
            }),
          },
        };
        return fn(mockTx);
      };

      try {
        await assert.rejects(
          async () => {
            await EnrolmentService.enrolStudent(
              { studentId: 'stu-1', courseId: 'c-1' },
              'admin-id'
            );
          },
          (err) => {
            assert.equal(err.statusCode, 400);
            assert.equal(err.code, 'COURSE_NOT_ACTIVE');
            return true;
          }
        );
      } finally {
        prisma.$transaction = originalTx;
      }
    });

    it('throws 409 COURSE_CAPACITY_FULL when course has reached its max capacity', async () => {
      const originalTx = prisma.$transaction;
      prisma.$transaction = async (fn) => {
        const mockTx = {
          student: { findUnique: async () => ({ id: 'stu-1', status: 'ACTIVE' }) },
          course: {
            findUnique: async () => ({
              id: 'c-full',
              code: 'CS201',
              status: 'ACTIVE',
              capacity: 25,
              _count: { enrolments: 25 },
            }),
          },
        };
        return fn(mockTx);
      };

      try {
        await assert.rejects(
          async () => {
            await EnrolmentService.enrolStudent(
              { studentId: 'stu-1', courseId: 'c-full' },
              'admin-id'
            );
          },
          (err) => {
            assert.equal(err.statusCode, 409);
            assert.equal(err.code, 'COURSE_CAPACITY_FULL');
            return true;
          }
        );
      } finally {
        prisma.$transaction = originalTx;
      }
    });

    it('throws 409 DUPLICATE_ENROLMENT when student is already enrolled in the course', async () => {
      const originalTx = prisma.$transaction;
      prisma.$transaction = async (fn) => {
        const mockTx = {
          student: { findUnique: async () => ({ id: 'stu-1', status: 'ACTIVE', studentNumber: 'STU-2026-0001' }) },
          course: {
            findUnique: async () => ({
              id: 'c-1',
              code: 'CS101',
              status: 'ACTIVE',
              capacity: 30,
              _count: { enrolments: 5 },
            }),
          },
          enrolment: {
            findUnique: async () => ({
              id: 'enr-1',
              status: 'ENROLLED',
            }),
          },
        };
        return fn(mockTx);
      };

      try {
        await assert.rejects(
          async () => {
            await EnrolmentService.enrolStudent(
              { studentId: 'stu-1', courseId: 'c-1' },
              'admin-id'
            );
          },
          (err) => {
            assert.equal(err.statusCode, 409);
            assert.equal(err.code, 'DUPLICATE_ENROLMENT');
            return true;
          }
        );
      } finally {
        prisma.$transaction = originalTx;
      }
    });
  });

  describe('Attendance Domain Rules', () => {
    it('normalizes various date inputs to midnight UTC Date object', () => {
      const input = '2026-10-21T18:45:00.000Z';
      const normalized = AttendanceService.normalizeDate(input);

      assert.equal(normalized.getUTCFullYear(), 2026);
      assert.equal(normalized.getUTCMonth(), 9); // October is month index 9
      assert.equal(normalized.getUTCDate(), 21);
      assert.equal(normalized.getUTCHours(), 0);
      assert.equal(normalized.getUTCMinutes(), 0);
      assert.equal(normalized.getUTCSeconds(), 0);
    });

    it('denies instructor access to courses assigned to other instructors', async () => {
      const originalFindUnique = prisma.course.findUnique;
      prisma.course.findUnique = async () => ({
        id: 'course-abc',
        code: 'CS300',
        instructorId: 'instructor-111',
        status: 'ACTIVE',
      });

      try {
        const instructorUser = { id: 'instructor-999', role: 'INSTRUCTOR' };

        await assert.rejects(
          async () => {
            await AttendanceService.verifyCourseAccess('course-abc', instructorUser);
          },
          (err) => {
            assert.equal(err.statusCode, 403);
            assert.equal(err.code, 'COURSE_ACCESS_FORBIDDEN');
            return true;
          }
        );
      } finally {
        prisma.course.findUnique = originalFindUnique;
      }
    });

    it('allows admin users access to any course roster', async () => {
      const originalFindUnique = prisma.course.findUnique;
      prisma.course.findUnique = async () => ({
        id: 'course-abc',
        code: 'CS300',
        instructorId: 'instructor-111',
        status: 'ACTIVE',
      });

      try {
        const adminUser = { id: 'admin-1', role: 'ADMIN' };
        const course = await AttendanceService.verifyCourseAccess('course-abc', adminUser);

        assert.equal(course.code, 'CS300');
      } finally {
        prisma.course.findUnique = originalFindUnique;
      }
    });
  });
});
