import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrolment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default passwords
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const instructorPasswordHash = await bcrypt.hash('Instructor123!', 10);

  // 3. Create Default Administrator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sms.local',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`[SEED] Created Admin: ${admin.email} (Password: Admin123!)`);

  // 4. Create Default Instructor
  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@sms.local',
      passwordHash: instructorPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: 'INSTRUCTOR',
      isActive: true,
    },
  });
  console.log(`[SEED] Created Instructor: ${instructor.email} (Password: Instructor123!)`);

  // 5. Create Sample Course
  const course = await prisma.course.create({
    data: {
      code: 'FS-101',
      title: 'Full-Stack Web Development Bootcamp',
      description: 'Comprehensive modern full-stack development covering React, Node.js, and PostgreSQL.',
      instructorId: instructor.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-15'),
      capacity: 25,
      status: 'ACTIVE',
    },
  });
  console.log(`[SEED] Created Course: ${course.code} - ${course.title}`);

  // 6. Create Sample Students
  const studentsData = [
    {
      studentNumber: 'STU-2026-0001',
      firstName: 'Alice',
      lastName: 'Morgan',
      email: 'alice.morgan@example.com',
      phone: '+1 555-0101',
      dateOfBirth: new Date('2001-04-12'),
      gender: 'Female',
      address: '124 Elm Street, Springfield',
      status: 'ACTIVE',
    },
    {
      studentNumber: 'STU-2026-0002',
      firstName: 'Marcus',
      lastName: 'Chen',
      email: 'marcus.chen@example.com',
      phone: '+1 555-0102',
      dateOfBirth: new Date('2000-08-23'),
      gender: 'Male',
      address: '456 Oak Avenue, Metropolis',
      status: 'ACTIVE',
    },
    {
      studentNumber: 'STU-2026-0003',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 555-0103',
      dateOfBirth: new Date('1999-11-05'),
      gender: 'Female',
      address: '789 Pine Road, Gotham',
      status: 'ACTIVE',
    },
    {
      studentNumber: 'STU-2026-0004',
      firstName: 'David',
      lastName: 'Okonkwo',
      email: 'david.okonkwo@example.com',
      phone: '+1 555-0104',
      dateOfBirth: new Date('2002-02-18'),
      gender: 'Male',
      address: '321 Maple Blvd, Star City',
      status: 'ACTIVE',
    },
    {
      studentNumber: 'STU-2026-0005',
      firstName: 'Sophia',
      lastName: 'Alvarez',
      email: 'sophia.alvarez@example.com',
      phone: '+1 555-0105',
      dateOfBirth: new Date('2003-07-30'),
      gender: 'Female',
      address: '654 Cedar Lane, Central City',
      status: 'ACTIVE',
    },
  ];

  const createdStudents = [];
  for (const stu of studentsData) {
    const s = await prisma.student.create({ data: stu });
    createdStudents.push(s);
  }
  console.log(`[SEED] Created ${createdStudents.length} sample students.`);

  // 7. Enrol students in the sample course
  for (const student of createdStudents) {
    await prisma.enrolment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        status: 'ENROLLED',
      },
    });
  }
  console.log(`[SEED] Enrolled ${createdStudents.length} students into ${course.code}.`);

  // 8. Record sample attendance
  const sampleAttendanceDates = [new Date('2026-09-02'), new Date('2026-09-03'), new Date('2026-09-04')];
  for (const attDate of sampleAttendanceDates) {
    for (const student of createdStudents) {
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          recordedById: instructor.id,
          date: attDate,
          status: 'PRESENT',
        },
      });
    }
  }
  console.log(`[SEED] Created baseline attendance records.`);

  // 9. Initial Activity Log
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'initial',
      metadata: { description: 'Initial development database seed completed.' },
    },
  });

  console.log('[SEED] Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
