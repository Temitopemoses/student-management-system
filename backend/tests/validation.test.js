import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema } from '../src/modules/auth/auth.validation.js';
import { createStudentSchema, studentQuerySchema } from '../src/modules/students/students.validation.js';
import { createCourseSchema, courseQuerySchema } from '../src/modules/courses/courses.validation.js';
import { enrolStudentSchema } from '../src/modules/enrolments/enrolments.validation.js';
import { recordBatchAttendanceSchema } from '../src/modules/attendance/attendance.validation.js';

describe('Validation Schemas (Zod)', () => {
  describe('Auth Validation', () => {
    it('accepts valid login credentials and normalizes email', () => {
      const result = loginSchema.safeParse({
        email: 'Admin.User@example.com ',
        password: 'Password123!',
      });

      assert.equal(result.success, true);
      assert.equal(result.data.email, 'admin.user@example.com');
    });

    it('rejects invalid email addresses', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123!',
      });

      assert.equal(result.success, false);
      const errors = result.error.errors.map((e) => e.message);
      assert.ok(errors.includes('Please provide a valid email address'));
    });

    it('rejects passwords shorter than 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'valid@example.com',
        password: '123',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.errors.some((e) => e.message.includes('at least 6 characters')));
    });
  });

  describe('Student Validation', () => {
    it('validates a valid student payload', () => {
      const result = createStudentSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+1 555-0199',
        status: 'ACTIVE',
      });

      assert.equal(result.success, true);
      assert.equal(result.data.firstName, 'Jane');
      assert.equal(result.data.status, 'ACTIVE');
    });

    it('allows empty optional email or phone strings without failing', () => {
      const result = createStudentSchema.safeParse({
        firstName: 'John',
        lastName: 'Smith',
        email: '',
        phone: '',
      });

      assert.equal(result.success, true);
      assert.equal(result.data.email, '');
    });

    it('rejects short first and last names', () => {
      const result = createStudentSchema.safeParse({
        firstName: 'J',
        lastName: '',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.errors.some((e) => e.path.includes('firstName')));
      assert.ok(result.error.errors.some((e) => e.path.includes('lastName')));
    });

    it('coerces and defaults query pagination parameters', () => {
      const result = studentQuerySchema.safeParse({
        page: '2',
        limit: '25',
        search: '  John ',
        status: 'ACTIVE',
      });

      assert.equal(result.success, true);
      assert.equal(result.data.page, 2);
      assert.equal(result.data.limit, 25);
      assert.equal(result.data.search, 'John');
      assert.equal(result.data.sortBy, 'createdAt');
      assert.equal(result.data.sortOrder, 'desc');
    });
  });

  describe('Course Validation', () => {
    it('forces course code to uppercase', () => {
      const result = createCourseSchema.safeParse({
        code: 'cs101',
        title: 'Introduction to Computer Science',
        startDate: '2026-09-01T09:00:00.000Z',
      });

      assert.equal(result.success, true);
      assert.equal(result.data.code, 'CS101');
    });

    it('fails when endDate is earlier than startDate', () => {
      const result = createCourseSchema.safeParse({
        code: 'CS102',
        title: 'Data Structures',
        startDate: '2026-09-01T09:00:00.000Z',
        endDate: '2026-08-01T09:00:00.000Z',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.errors.some((e) => e.message === 'End date cannot be earlier than start date'));
    });
  });

  describe('Enrolment Validation', () => {
    it('rejects non-UUID student or course IDs', () => {
      const result = enrolStudentSchema.safeParse({
        studentId: '12345',
        courseId: 'invalid-id',
      });

      assert.equal(result.success, false);
      assert.ok(result.error.errors.some((e) => e.path.includes('studentId')));
      assert.ok(result.error.errors.some((e) => e.path.includes('courseId')));
    });

    it('accepts valid UUIDs for enrolment', () => {
      const result = enrolStudentSchema.safeParse({
        studentId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        courseId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        notes: 'Enrolled via portal',
      });

      assert.equal(result.success, true);
    });
  });

  describe('Attendance Validation', () => {
    it('rejects batch attendance with an empty records array', () => {
      const result = recordBatchAttendanceSchema.safeParse({
        courseId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        date: '2026-10-21',
        records: [],
      });

      assert.equal(result.success, false);
      assert.ok(result.error.errors.some((e) => e.message.includes('At least one attendance record')));
    });

    it('accepts valid batch attendance with valid enum statuses', () => {
      const result = recordBatchAttendanceSchema.safeParse({
        courseId: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        date: '2026-10-21',
        records: [
          {
            studentId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
            status: 'PRESENT',
            notes: 'On time',
          },
          {
            studentId: 'f1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
            status: 'EXCUSED',
            notes: 'Medical certificate provided',
          },
        ],
      });

      assert.equal(result.success, true);
      assert.equal(result.data.records.length, 2);
    });
  });
});
