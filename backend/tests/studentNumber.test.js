import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateStudentNumber } from '../src/utils/studentNumber.js';

describe('Student Number Generator Utility', () => {
  it('generates STU-<year>-0001 when no existing students exist in target year', async () => {
    const mockTx = {
      student: {
        findFirst: async () => null,
      },
    };

    const studentNumber = await generateStudentNumber(mockTx, 2026);
    assert.equal(studentNumber, 'STU-2026-0001');
  });

  it('increments sequence from previous student number', async () => {
    const mockTx = {
      student: {
        findFirst: async () => ({ studentNumber: 'STU-2026-0001' }),
      },
    };

    const studentNumber = await generateStudentNumber(mockTx, 2026);
    assert.equal(studentNumber, 'STU-2026-0002');
  });

  it('correctly increments across tens and hundreds with 4-digit zero padding', async () => {
    const mockTx = {
      student: {
        findFirst: async () => ({ studentNumber: 'STU-2026-0099' }),
      },
    };

    const studentNumber = await generateStudentNumber(mockTx, 2026);
    assert.equal(studentNumber, 'STU-2026-0100');
  });

  it('handles custom target year properly', async () => {
    const mockTx = {
      student: {
        findFirst: async () => ({ studentNumber: 'STU-2025-0450' }),
      },
    };

    const studentNumber = await generateStudentNumber(mockTx, 2025);
    assert.equal(studentNumber, 'STU-2025-0451');
  });
});
