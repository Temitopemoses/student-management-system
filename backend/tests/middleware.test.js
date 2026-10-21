import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireRole } from '../src/middleware/authorize.js';
import { AppError, errorHandler } from '../src/middleware/errorHandler.js';
import { authenticate } from '../src/middleware/authenticate.js';
import { config } from '../src/config/index.js';
import prisma from '../src/config/prisma.js';

describe('Middleware Test Suite', () => {
  describe('RBAC Authorization Middleware (requireRole)', () => {
    it('calls next() when user has the authorized role', () => {
      const req = {
        user: { id: 'u1', role: 'ADMIN' },
      };
      let nextCalledWith = undefined;
      const next = (err) => {
        nextCalledWith = err;
      };

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, {}, next);

      assert.equal(nextCalledWith, undefined);
    });

    it('returns 401 UNAUTHORIZED if req.user is missing', () => {
      const req = {};
      let errorPassed = null;
      const next = (err) => {
        errorPassed = err;
      };

      const middleware = requireRole('ADMIN');
      middleware(req, {}, next);

      assert.ok(errorPassed instanceof AppError);
      assert.equal(errorPassed.statusCode, 401);
      assert.equal(errorPassed.code, 'UNAUTHORIZED');
    });

    it('returns 403 FORBIDDEN if user role is not authorized', () => {
      const req = {
        user: { id: 'u2', role: 'INSTRUCTOR' },
      };
      let errorPassed = null;
      const next = (err) => {
        errorPassed = err;
      };

      const middleware = requireRole('ADMIN');
      middleware(req, {}, next);

      assert.ok(errorPassed instanceof AppError);
      assert.equal(errorPassed.statusCode, 403);
      assert.equal(errorPassed.code, 'FORBIDDEN');
    });
  });

  describe('Centralized Error Handler (errorHandler)', () => {
    it('formats AppError into standardized JSON response', () => {
      const error = new AppError('Resource not found', 404, 'NOT_FOUND');
      let responseStatus = null;
      let responseJson = null;

      const req = {};
      const res = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(payload) {
          responseJson = payload;
          return this;
        },
      };

      errorHandler(error, req, res, () => {});

      assert.equal(responseStatus, 404);
      assert.equal(responseJson.success, false);
      assert.equal(responseJson.message, 'Resource not found');
      assert.equal(responseJson.code, 'NOT_FOUND');
    });

    it('includes validation errors array when present', () => {
      const issues = [{ field: 'email', message: 'Invalid email' }];
      const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR', issues);

      let responseStatus = null;
      let responseJson = null;

      const res = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(payload) {
          responseJson = payload;
          return this;
        },
      };

      errorHandler(error, {}, res, () => {});

      assert.equal(responseStatus, 422);
      assert.deepEqual(responseJson.errors, issues);
    });
  });

  describe('Authentication Middleware (authenticate)', () => {
    it('returns 401 when no cookie and no Authorization header is provided', async () => {
      const req = { cookies: {}, headers: {} };
      let errorPassed = null;
      const next = (err) => {
        errorPassed = err;
      };

      await authenticate(req, {}, next);

      assert.ok(errorPassed instanceof AppError);
      assert.equal(errorPassed.statusCode, 401);
      assert.equal(errorPassed.code, 'UNAUTHORIZED');
    });

    it('returns 401 when an invalid JWT token is supplied', async () => {
      const req = {
        cookies: {},
        headers: { authorization: 'Bearer completely-invalid-token' },
      };
      let errorPassed = null;
      const next = (err) => {
        errorPassed = err;
      };

      await authenticate(req, {}, next);

      assert.ok(errorPassed instanceof AppError);
      assert.equal(errorPassed.statusCode, 401);
      assert.equal(errorPassed.code, 'INVALID_TOKEN');
    });

    it('authenticates active user successfully with valid JWT token', async () => {
      const testUser = {
        id: 'test-user-uuid-1',
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'Member',
        role: 'ADMIN',
        isActive: true,
      };

      const token = jwt.sign({ id: testUser.id, role: testUser.role }, config.jwt.secret, {
        expiresIn: '1h',
      });

      // Stub prisma.user.findUnique temporarily
      const originalFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = async () => testUser;

      try {
        const req = {
          cookies: { [config.jwt.cookieName]: token },
          headers: {},
        };
        let nextCalled = false;
        let nextError = null;
        const next = (err) => {
          if (err) nextError = err;
          else nextCalled = true;
        };

        await authenticate(req, {}, next);

        assert.equal(nextCalled, true);
        assert.equal(nextError, null);
        assert.deepEqual(req.user, testUser);
      } finally {
        prisma.user.findUnique = originalFindUnique;
      }
    });

    it('rejects deactivated user with 403 FORBIDDEN', async () => {
      const testUser = {
        id: 'deactivated-user-uuid',
        email: 'blocked@example.com',
        role: 'INSTRUCTOR',
        isActive: false,
      };

      const token = jwt.sign({ id: testUser.id, role: testUser.role }, config.jwt.secret, {
        expiresIn: '1h',
      });

      const originalFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = async () => testUser;

      try {
        const req = {
          cookies: {},
          headers: { authorization: `Bearer ${token}` },
        };
        let nextError = null;
        const next = (err) => {
          nextError = err;
        };

        await authenticate(req, {}, next);

        assert.ok(nextError instanceof AppError);
        assert.equal(nextError.statusCode, 403);
        assert.equal(nextError.code, 'FORBIDDEN');
      } finally {
        prisma.user.findUnique = originalFindUnique;
      }
    });
  });
});
