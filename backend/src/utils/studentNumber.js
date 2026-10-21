/**
 * Generates a unique, collision-resistant student number.
 * Format: STU-YYYY-XXXX (e.g. STU-2026-0001)
 *
 * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction or client
 * @param {number} [targetYear] - The 4-digit academic year (defaults to current year)
 * @returns {Promise<string>}
 */
export async function generateStudentNumber(tx, targetYear = new Date().getFullYear()) {
  const prefix = `STU-${targetYear}-`;

  // Find the student with the highest sequence number in the current year
  const lastStudent = await tx.student.findFirst({
    where: {
      studentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentNumber: 'desc',
    },
    select: {
      studentNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastStudent && lastStudent.studentNumber) {
    const parts = lastStudent.studentNumber.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSequence = currentSeq + 1;
    }
  }

  // Pad sequence to 4 digits (e.g., 0001, 0042)
  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}
