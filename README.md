# Student Management System (SMS)

A full-stack, enterprise-grade education administration platform built with **Node.js, Express, PostgreSQL, Prisma ORM, React (Vite), and Tailwind CSS**.

Designed for training centres, coding academies, and educational institutions to manage students, course catalogues, student enrolments, role-based access, and daily class attendance with audit trails.

---

## Table of Contents

1. [Project Overview & Problem Statement](#project-overview--problem-statement)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Database Design & Relationships](#database-design--relationships)
6. [REST API Documentation](#rest-api-documentation)
7. [Installation & Local Setup](#installation--local-setup)
8. [Environment Variables](#environment-variables)
9. [Database Migrations & Seeding](#database-migrations--seeding)
10. [Automated Testing](#automated-testing)
11. [Production Deployment Guide](#production-deployment-guide)
12. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Project Overview & Problem Statement

Educational institutions face operational inefficiencies and data synchronization issues when using fragmented tools (spreadsheets, paper rosters, email chains) to track student registrations, course capacities, and classroom attendance.

This **Student Management System (SMS)** provides a centralized, secure web application that:
- Solves race conditions in course enrolments by enforcing transactional capacity limits.
- Eliminates attendance discrepancies with daily UTC date-normalization and audit-logged amendments.
- Guarantees role-based data isolation so instructors can only access and modify courses assigned to them.
- Provides staff and administrators with real-time academic operational metrics.

---

## Key Features

### 1. Role-Based Access Control (RBAC) & Authentication
- **Administrator Role**: Unrestricted administrative access across student records, course catalogues, staff accounts, attendance rosters, and institution-wide analytics.
- **Instructor Role**: Scoped access restricted to courses assigned to them, enrolled student rosters, and course-specific attendance recording.
- **Security**: Stateless JWT stored in secure HTTP-only cookies (preventing XSS theft), password hashing using `bcryptjs` (salt rounds = 12), login rate-limiting (`express-rate-limit`), and HTTP security headers (`helmet`).

### 2. Student Lifecycle Management
- Collision-resistant student identifier generation: `STU-YYYY-XXXX` sequential padding.
- Full CRUD operations with soft-archiving to maintain academic integrity and transcript history.
- Real-time search by full name, student number, or email address.
- Server-side filtering by status (`ACTIVE`, `INACTIVE`, `ARCHIVED`) and customizable pagination (`page`, `limit`, `sortBy`, `sortOrder`).

### 3. Course Management & Capacity Protection
- Course management with status lifecycles (`DRAFT` → `ACTIVE` → `COMPLETED` → `ARCHIVED`).
- Instructor assignment and validation of chronological date ranges (`endDate >= startDate`).
- Strict capacity caps preventing over-subscription using isolated database transactions.

### 4. Enrolment Workflows
- Many-to-many relationship linking students and courses.
- Concurrency-safe enrolment verification: validates that both student and course are `ACTIVE`.
- Safe withdrawal mechanics (`WITHDRAWN`) preserving historical engagement without hard deleting records.

### 5. Attendance Tracking & Auditing
- Batch daily attendance recording (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
- Strict UTC-midnight date normalization to prevent duplicate rosters for the same day.
- Audit trail logging (`ActivityLog`) capturing user identity, previous status, updated status, timestamp, and client IP address on corrections.

### 6. Interactive Executive Dashboard
- Live database-backed metrics: active students, active courses, active instructors, and total active enrolments.
- Attendance health overview with percentage breakdown.
- Recent registration feed and audit activity log.

---

## Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router 7
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors and cookie credentials
- **Code Quality**: Oxlint

### Backend
- **Runtime**: Node.js (v20+ LTS / v24) with native ES Modules (`import`/`export`)
- **Framework**: Express 4.21
- **Database ORM**: Prisma ORM 5.22
- **Validation**: Zod schema validation for request bodies, query strings, and route parameters
- **Security**: Helmet, CORS with strict origin validation, Cookie-Parser, BcryptJS, JSONWebToken, Express-Rate-Limit
- **Logging**: Morgan HTTP logger

### Database
- **Engine**: PostgreSQL 15+
- **Integrity**: Foreign keys, composite unique constraints, indexes on status and query fields, cascading/setNull referential actions

---

## System Architecture

```mermaid
flowchart TD
    Client["React Frontend (Vite + Tailwind)"]
    API["Express REST API (Port 5000)"]
    Middleware["Security & Auth Middleware<br/>(Helmet, Rate-Limit, Auth, RBAC, Zod Validate)"]
    Controllers["Domain Controllers<br/>(Auth, Students, Courses, Enrolments, Attendance, Dashboard)"]
    Services["Domain Services & Business Rules"]
    Prisma["Prisma ORM Client"]
    Postgres[("PostgreSQL Database")]

    Client -->|"HTTP / HTTPS (Cookies & JSON)"| API
    API --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma -->|"SQL Queries / Transactions"| Postgres
```

---

## Database Design & Relationships

```mermaid
erDiagram
    User ||--o{ Course : "instructs"
    User ||--o{ Attendance : "records"
    User ||--o{ ActivityLog : "performs"
    Student ||--o{ Enrolment : "enrols in"
    Student ||--o{ Attendance : "has"
    Course ||--o{ Enrolment : "contains"
    Course ||--o{ Attendance : "takes"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        Role role "ADMIN | INSTRUCTOR"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Student {
        uuid id PK
        string studentNumber UK
        string firstName
        string lastName
        string email UK
        string phone
        datetime dateOfBirth
        string gender
        string address
        StudentStatus status "ACTIVE | INACTIVE | ARCHIVED"
        string profileImageUrl
        datetime createdAt
        datetime updatedAt
    }

    Course {
        uuid id PK
        string code UK
        string title
        string description
        uuid instructorId FK
        datetime startDate
        datetime endDate
        int capacity
        CourseStatus status "DRAFT | ACTIVE | COMPLETED | ARCHIVED"
        datetime createdAt
        datetime updatedAt
    }

    Enrolment {
        uuid id PK
        uuid studentId FK
        uuid courseId FK
        datetime enrolledAt
        EnrolmentStatus status "ENROLLED | COMPLETED | WITHDRAWN"
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Attendance {
        uuid id PK
        uuid studentId FK
        uuid courseId FK
        date date
        AttendanceStatus status "PRESENT | ABSENT | LATE | EXCUSED"
        string notes
        uuid recordedById FK
        datetime createdAt
        datetime updatedAt
    }

    ActivityLog {
        uuid id PK
        uuid userId FK
        string action
        string entityType
        string entityId
        json metadata
        string ipAddress
        datetime createdAt
    }
```

---

## REST API Documentation

Base URL: `/api/v1`

### 1. Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates credentials, sets HTTP-only session cookie |
| `POST` | `/auth/logout` | Authenticated | Clears session cookie |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user profile |

### 2. Dashboard & Analytics
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Authenticated | Overall student, course, instructor, enrolment & attendance stats |
| `GET` | `/dashboard/recent-activity` | Admin only | Audit activity log entries with actor details |

### 3. Students
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | Authenticated | Paginated, filtered, and sorted student list |
| `POST` | `/students` | Admin only | Creates a new student record (auto-generates studentNumber) |
| `GET` | `/students/:id` | Authenticated | Detailed student profile, enrolled courses, and attendance |
| `PATCH` | `/students/:id` | Admin only | Updates student profile information |
| `DELETE` | `/students/:id` | Admin only | Soft-archives student record (`status = 'ARCHIVED'`) |

### 4. Courses
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/courses` | Authenticated | Paginated list of courses with instructor information |
| `POST` | `/courses` | Admin only | Creates a new course |
| `GET` | `/courses/:id` | Authenticated | Course details, assigned instructor, and enrolled roster |
| `PATCH` | `/courses/:id` | Admin only | Updates course details, capacity, or instructor assignment |
| `DELETE` | `/courses/:id` | Admin only | Soft-archives course (`status = 'ARCHIVED'`) |

### 5. Enrolments
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/enrolments` | Authenticated | Query enrolments by course, student, or status |
| `POST` | `/enrolments` | Admin only | Enrols student into course (checks capacity & status) |
| `PATCH` | `/enrolments/:id` | Admin only | Modifies enrolment record |
| `POST` | `/enrolments/:id/withdraw` | Admin only | Marks enrolment as `WITHDRAWN` |

### 6. Attendance
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/attendance` | Authenticated | Paginated attendance records with course/student filters |
| `GET` | `/attendance/roster` | Authenticated | Daily roster for course and date with marked status |
| `POST` | `/attendance/batch` | Instructor / Admin | Submits batch attendance for a course session |
| `PATCH` | `/attendance/:id` | Instructor / Admin | Corrects an individual attendance record (audited) |

---

## Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v20.x or v22.x LTS (compatible with v24)
- [PostgreSQL](https://www.postgresql.org/) v14+ running locally or on a cloud provider (e.g. Supabase, Neon)
- npm v10+

### Step-by-Step Setup

1. **Clone the repository**:
   ```powershell
   git clone <repository-url>
   cd SMS
   ```

2. **Backend Setup**:
   ```powershell
   cd backend
   npm install
   cp .env.example .env
   ```
   *Edit `backend/.env` with your PostgreSQL database credentials and JWT secret.*

3. **Run Database Migrations & Seed**:
   ```powershell
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```

4. **Frontend Setup**:
   ```powershell
   cd ../frontend
   npm install
   cp .env.example .env
   ```

5. **Start Development Servers**:
   - Backend (from `backend/`):
     ```powershell
     npm run dev
     ```
   - Frontend (from `frontend/`):
     ```powershell
     npm run dev
     ```
   - *Alternatively, from the root directory:*
     ```powershell
     npm run dev:backend
     npm run dev:frontend
     ```

6. Open `http://localhost:5173` in your browser.

### Default Seed Credentials
- **Administrator**: `admin@institution.edu` / `AdminPass123!`
- **Instructor**: `instructor@institution.edu` / `InstructorPass123!`

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Express listening port | `5000` |
| `NODE_ENV` | Application environment | `development` or `production` |
| `FRONTEND_URL` | Client origin for CORS and cookies | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/sms_db?schema=public` |
| `JWT_SECRET` | Secret key for signing session tokens | *Minimum 32 random characters* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `COOKIE_NAME` | Name of the HTTP-only session cookie | `sms_session` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Target backend REST API base route | `http://localhost:5000/api/v1` |

---

## Database Migrations & Seeding

The application manages PostgreSQL relational tables using Prisma Migrations.

- Generate Prisma Client:
  ```powershell
  npx prisma generate
  ```
- Apply migrations to development database:
  ```powershell
  npx prisma migrate dev
  ```
- Inspect database with Prisma Studio:
  ```powershell
  npx prisma studio
  ```
- Seed realistic development fixtures:
  ```powershell
  npm run seed
  ```

---

## Automated Testing

Backend tests utilize Node.js's built-in native test runner (`node:test`) and strict assertion library (`node:assert/strict`).

To run the complete test suite:
```powershell
npm --prefix backend test
```

### Test Coverage Summary (34 Tests, 14 Test Suites, 100% Pass)
- **Validation Suite (`validation.test.js`)**:
  - Request schema sanitization and normalization (email lowercasing, space trimming).
  - Date boundaries (`endDate >= startDate`).
  - UUID type checking for foreign keys.
  - Roster payload boundary verification.
- **Identifier Suite (`studentNumber.test.js`)**:
  - Sequential student number generation (`STU-YYYY-0001` → `STU-YYYY-XXXX`).
  - Collision avoidance and zero-padding across thresholds.
- **Middleware Suite (`middleware.test.js`)**:
  - Authentication token verification from HTTP-only cookie and Authorization Bearer header.
  - Session rejection for missing, invalid, or expired tokens.
  - Account status checks (blocking deactivated staff accounts with 403).
  - RBAC permission enforcement (`requireRole`).
  - Error formatting and operational error sanitation.
- **Domain Business Rules Suite (`businessRules.test.js`)**:
  - Course capacity enforcement (`409 COURSE_CAPACITY_FULL`).
  - Prevention of duplicate student enrolments (`409 DUPLICATE_ENROLMENT`).
  - Status restrictions (preventing enrolments in inactive students or inactive courses).
  - Instructor access isolation (instructors cannot access courses assigned to others).
  - Daily UTC date normalization.

---

## Production Deployment Guide

### Recommended Stack
- **Database**: Managed PostgreSQL (e.g., Supabase, Neon, AWS RDS, Railway Postgres).
- **Backend API**: Render, Railway, or VPS (Node.js LTS).
- **Frontend SPA**: Vercel, Netlify, or Cloudflare Pages.

### Backend Deployment Steps
1. Set `NODE_ENV=production`.
2. Provide `DATABASE_URL`, `FRONTEND_URL`, and a high-entropy `JWT_SECRET`.
3. In your build command, run:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
4. Start script:
   ```bash
   node src/server.js
   ```

### Frontend Deployment Steps
1. Provide `VITE_API_URL=https://api.yourdomain.com/api/v1`.
2. Build command:
   ```bash
   npm install && npm run build
   ```
3. Output directory: `dist`.
4. Configure SPA fallback routing (`/*` rewrites to `/index.html`).

---

## Known Limitations & Future Improvements

### Current Design Scope
- Initial release implements two distinct staff roles: `ADMIN` and `INSTRUCTOR`.
- Students are managed as academic profiles and do not have student portal user credentials.

### Future Enhancements
- **Student Portal**: Self-service login for students to review course schedules, grades, and personal attendance records.
- **Email & SMS Notifications**: Webhook or transactional email delivery for enrolment confirmations and absence alerts.
- **Grading & Assessment**: Academic transcript generation, assignments, and GPA computation modules.
- **Export Capabilities**: CSV/PDF export for attendance reports, course rosters, and administrative audits.

---

## License
MIT License. Created for education administration portfolio evaluation.
