# GEMINI.md — Student Management System

## 1. Project Overview

You are a senior full-stack software engineer, software architect, UI/UX implementation specialist, and technical mentor.

Help me build a professional, portfolio-ready **Student Management System (SMS)** using React, Node.js, Express, and PostgreSQL.

The application should be suitable for a real training centre, coding academy, or educational institution. It must demonstrate the technical skills expected of a junior full-stack developer applying for professional software engineering roles.

This is also a learning project. I already have experience with JavaScript, React, Python, Django, Flask, HTML, CSS, and Bootstrap. I am learning Node.js and Express, so explain unfamiliar backend concepts clearly without overexplaining basic JavaScript concepts I already understand.

Do not build the entire application as one giant code dump. Develop it in manageable, testable phases.

## 2. Project Objectives

The system must allow authorized staff to:

- Register and manage students.
- Create and manage courses.
- Enrol students in courses.
- Record and track student attendance.
- View student profiles and academic information.
- Search, filter, sort, and paginate records.
- View dashboard statistics.
- Manage user authentication and role-based permissions.

The finished application must be functional, secure, responsive, maintainable, and deployable.

## 3. Required Technology Stack

### Frontend
- React with Vite.
- JavaScript initially; do not introduce TypeScript unless explicitly approved.
- React Router for navigation.
- Tailwind CSS for styling.
- Lucide React for icons.
- Axios for HTTP requests.
- React Hook Form for form management where useful.
- Zod for client-side schema validation where appropriate.

### Backend
- Node.js using a currently supported LTS version.
- Express.js.
- JavaScript with ES Modules (`import` and `export`) consistently throughout the backend.
- Prisma ORM for database access.
- Zod for request validation.
- bcrypt or bcryptjs for password hashing.
- Secure, HTTP-only cookie-based sessions or another justified authentication design.
- Helmet for security-related HTTP headers.
- A suitable rate-limiting library for sensitive endpoints.

### Database
- PostgreSQL.
- Prisma schema and migrations.
- Foreign keys, unique constraints, indexes, and appropriate deletion rules.

### Development and Testing
- Git and GitHub.
- npm.
- Postman for API testing.
- Vitest and React Testing Library for frontend tests.
- Node.js-compatible backend tests using the built-in test runner or another justified test framework.
- A suitable integration-testing approach for the API and database.

Use stable, mutually compatible package versions. Check current official documentation before relying on version-specific APIs. Do not use deprecated APIs or install unnecessary dependencies.

## 4. Application Roles and Permissions

Implement two roles for the initial version.

### Administrator
- Access the administrative dashboard.
- Create, view, update, and archive student records.
- Create, update, and archive courses.
- Enrol students in courses.
- Record, review, and correct attendance.
- Create and manage instructor accounts.
- View system statistics.

### Instructor
- Access the dashboard appropriate to their permissions.
- View courses assigned to them.
- View enrolled students in assigned courses.
- Record and review attendance for assigned courses.
- View relevant student and course information.

Enforce permissions on the backend. Hiding buttons in React is not sufficient authorization.

A user must never access another role's protected operations by manually changing an API request.

Public registration must not allow users to assign themselves the administrator role. Seed the initial administrator through a secure development or deployment process.

## 5. Functional Requirements

### A. Authentication

Implement:
- Login and logout.
- Secure password hashing.
- Authentication persistence across page refreshes.
- Protected frontend routes.
- Backend authentication middleware.
- Role-based authorization middleware.
- Session expiration and appropriate cookie settings.
- Login rate limiting.
- Clear validation and authentication error messages.

Do not store session identifiers or authentication tokens in localStorage.

Choose a secure, maintainable authentication approach and document the decision. If using cookie-based authentication, configure credentials, CORS, cookie attributes, and CSRF protection appropriately for the deployment architecture.

Never return password hashes or secrets in API responses.

### B. Dashboard

Display:
- Total active students.
- Total active courses.
- Total active instructors.
- Total current enrolments.
- Attendance statistics for a clearly specified period.
- Recently registered students.
- Recent relevant activities.

Dashboard statistics must come from the database, not hardcoded numbers.

Include loading, empty, and error states. Avoid misleading statistics when data is unavailable.

### C. Student Management

Each student should have:
- Unique student number.
- First name.
- Last name.
- Email address, if provided.
- Phone number, if provided.
- Date of birth, if required.
- Gender, if required by the institution.
- Address, if required.
- Registration date.
- Status: active, inactive, or archived.
- Optional profile image.

Requirements:
- Create, read, update, and archive students.
- View a student's complete profile.
- Search by name, student number, or email.
- Filter by status and relevant fields.
- Sort and paginate results.
- Validate input on both frontend and backend.
- Prevent duplicate student numbers.
- Handle optional email addresses correctly.
- Avoid exposing unnecessary personal information.

Use a consistent student-number generation strategy that prevents collisions. Do not rely on the array index, current student count, or an unsafe timestamp-only identifier.

### D. Course Management

Each course should have:
- Unique course code.
- Course title.
- Description.
- Instructor assignment.
- Start date.
- End date, if applicable.
- Capacity, if applicable.
- Status: draft, active, completed, or archived.

Requirements:
- Create and update courses.
- View course details.
- Assign instructors.
- Search and filter courses.
- View the students enrolled in a course.
- Prevent invalid date ranges.
- Prevent enrolment beyond course capacity when capacity is configured.

Define and enforce clear rules for archiving courses that still have enrolments.

### E. Student Enrolment

Implement a many-to-many relationship between students and courses through an enrolment model.

Each enrolment should record:
- Student.
- Course.
- Enrolment date.
- Status: enrolled, completed, or withdrawn.
- Optional notes.

Requirements:
- Enrol a student in a course.
- Prevent duplicate enrolments.
- View all courses associated with a student.
- View all students enrolled in a course.
- Withdraw a student without deleting historical records.
- Update enrolment status.
- Handle concurrent enrolment and capacity checks safely.

Use database transactions where multiple operations must succeed or fail together.

### F. Attendance Management

Each attendance record should include:
- Student.
- Course.
- Attendance date.
- Status: present, absent, late, or excused.
- Optional notes.
- The staff member who recorded it.

Requirements:
- Record attendance for students enrolled in a course.
- Display attendance by course and date.
- Filter by student, course, and date range.
- Calculate attendance percentages.
- Prevent duplicate attendance records for the same student, course, and date.
- Permit authorized corrections while preserving a reasonable audit trail.

Attendance percentages must use clearly defined rules for excused absences and withdrawn enrolments. Explain the chosen rules in the documentation.

### G. Search, Filtering, Sorting, and Pagination

Implement server-side pagination for larger datasets.

Use query parameters such as:
- `page`
- `limit`
- `search`
- `status`
- `sortBy`
- `sortOrder`

Validate all query parameters. Allowlist sortable database fields instead of directly trusting client-provided SQL or ORM field names.

Return a consistent paginated response containing the records and useful pagination metadata.

### H. Notifications and Activity History

For the initial version, implement an activity log for important actions, including:
- Student creation and updates.
- Course creation and updates.
- Enrolments and withdrawals.
- Attendance creation and corrections.
- Relevant administrative actions.

Record the acting user, action, affected entity, and timestamp.

Do not log passwords, session secrets, or unnecessary sensitive personal data.

Email and SMS notifications are optional future enhancements. Do not add paid external services without approval.

## 6. Database Design

Design and document a relational schema covering at least:

1. User
2. Student
3. Course
4. Enrolment
5. Attendance
6. ActivityLog

Use a separate User and Student model when appropriate so a student does not automatically need a staff login.

Define:
- Primary keys.
- Foreign keys.
- Unique constraints.
- Required and optional fields.
- Relationships.
- Appropriate indexes.
- Created and updated timestamps.
- Archive or status fields where appropriate.

Use migrations to manage schema changes. Do not rely on destructive schema synchronization in production.

Before writing the complete schema, explain the proposed relationships and ask for approval if a major architectural decision is needed.

## 7. REST API Design

Use the prefix `/api/v1`.

Suggested endpoints:

### Authentication
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Dashboard
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/recent-activity`

### Students
- `GET /api/v1/students`
- `POST /api/v1/students`
- `GET /api/v1/students/:id`
- `PATCH /api/v1/students/:id`
- `DELETE /api/v1/students/:id` — only if implemented as a safe archive operation.

### Courses
- `GET /api/v1/courses`
- `POST /api/v1/courses`
- `GET /api/v1/courses/:id`
- `PATCH /api/v1/courses/:id`
- `DELETE /api/v1/courses/:id` — only if implemented as a safe archive operation.

### Enrolments
- `GET /api/v1/enrolments`
- `POST /api/v1/enrolments`
- `PATCH /api/v1/enrolments/:id`
- `POST /api/v1/enrolments/:id/withdraw`

### Attendance
- `GET /api/v1/attendance`
- `POST /api/v1/attendance`
- `PATCH /api/v1/attendance/:id`
- `GET /api/v1/courses/:courseId/attendance`

### Staff
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`

Adjust the endpoints where necessary to avoid duplication and follow REST conventions.

For every endpoint, define:
- HTTP method.
- Request parameters and body.
- Authentication requirements.
- Authorization requirements.
- Validation rules.
- Success status and response format.
- Expected error responses.

Use appropriate status codes, including `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422` where appropriate, and `500` for unexpected server failures.

Use a consistent JSON error format, for example:

{
  "success": false,
  "message": "The requested resource was not found.",
  "code": "RESOURCE_NOT_FOUND"
}

Never expose stack traces, database details, or secrets to production clients.

## 8. Backend Architecture

Keep the backend modular and maintainable.

Suggested structure:

backend/
  prisma/
    schema.prisma
    migrations/
    seed.js
  src/
    app.js
    server.js
    config/
    middleware/
      authenticate.js
      authorize.js
      errorHandler.js
      validate.js
    modules/
      auth/
      students/
      courses/
      enrolments/
      attendance/
      dashboard/
      users/
      activity/
    utils/
    tests/
  .env.example
  package.json

Use the following responsibilities:
- Routes define endpoints and attach middleware.
- Controllers handle HTTP requests and responses.
- Services contain business logic.
- Prisma handles database access.
- Validation schemas verify input.
- Middleware handles shared concerns.
- Centralized error handling standardizes failures.

Do not create unnecessary abstraction layers or files without a clear purpose. Keep simple operations simple while preserving separation of responsibilities.

## 9. Frontend Architecture

Suggested structure:

frontend/
  src/
    api/
    assets/
    components/
      common/
      layout/
      forms/
      tables/
    features/
      auth/
      dashboard/
      students/
      courses/
      enrolments/
      attendance/
      users/
    hooks/
    layouts/
    pages/
    routes/
    utils/
    App.jsx
    main.jsx

Create reusable components such as:
- Sidebar.
- Top navigation.
- Page header.
- Stat card.
- Search input.
- Filter controls.
- Data table.
- Pagination controls.
- Confirmation dialog.
- Form fields.
- Toast notifications.
- Loading skeleton.
- Empty state.
- Error state.

Implement responsive layouts for desktop, tablet, and mobile.

Use accessible form labels, keyboard-friendly controls, sufficient contrast, and meaningful feedback. Avoid using alerts as the primary interface for routine operations.

Every important screen must have:
- Loading state.
- Empty state.
- Error state.
- Successful operation feedback.
- Appropriate form validation.

Do not create decorative buttons that do nothing. Every visible interactive control must work or be clearly marked as unavailable.

## 10. UI and Design Direction

Create a polished, professional education-administration interface.

Visual direction:
- Clean white and light-gray surfaces.
- Dark, readable text.
- Subtle blue or indigo accents.
- Consistent spacing and typography.
- Restrained use of shadows and borders.
- Clear visual hierarchy.
- Professional tables and forms.
- Simple, useful data visualizations only where they add value.

The dashboard should resemble a credible modern SaaS administration platform, not a generic template filled with unnecessary cards.

Use consistent design tokens and reusable components. Avoid excessive gradients, excessive animations, clutter, and decorative icons without meaning.

Prioritize usability and accessibility over visual effects.

## 11. Security Requirements

- Validate and normalize all untrusted input on the server.
- Hash passwords using an appropriate password-hashing algorithm.
- Keep secrets and database credentials in environment variables.
- Commit `.env.example`, never real `.env` files.
- Configure CORS with explicit allowed origins.
- Protect authentication endpoints against brute-force attempts.
- Apply authorization checks to every protected resource.
- Prevent insecure direct object references.
- Avoid unsafe dynamic SQL.
- Handle cookie and CSRF security correctly for the selected authentication architecture.
- Use Helmet and suitable security headers.
- Prevent sensitive information from appearing in logs.
- Ensure database operations use appropriate transactions and constraints.
- Use least-privilege database credentials.
- Seed only safe development data.
- Provide a clear procedure for creating the initial administrator securely.
- Never hardcode production credentials.

Do not claim the application is secure merely because these packages are installed. Test the actual security controls.

## 12. Environment Configuration

Provide a `.env.example` file documenting required variables, such as:

DATABASE_URL=
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

Add any authentication, session, or cookie configuration variables required by the selected implementation.

Never invent actual credentials or commit secret values.

Explain how to:
1. Create the PostgreSQL database.
2. Configure the environment.
3. Install dependencies.
4. Run migrations.
5. Seed development data.
6. Start the backend.
7. Start the frontend.

Provide Windows PowerShell commands where useful.

## 13. Testing Requirements

Write meaningful tests for:
- Authentication and authorization.
- Student CRUD operations.
- Course CRUD operations.
- Duplicate student numbers.
- Duplicate enrolments.
- Course capacity limits.
- Attendance validation and uniqueness.
- Pagination and filtering.
- Invalid requests.
- Missing resources.
- Database failures and error handling.
- Important frontend forms and interactions.

Use an isolated test database or another safe testing strategy. Never run automated tests against a production database.

Include a small, repeatable manual testing checklist for Postman and the browser.

Do not report tests as passing unless they have actually been executed and passed.

## 14. Documentation and GitHub Readiness

Create a professional README containing:
- Project overview.
- Problem statement.
- Features.
- Technology stack.
- Architecture overview.
- Database relationships.
- API endpoint documentation.
- Installation and setup.
- Environment variables.
- Migration and seeding instructions.
- Testing instructions.
- Screenshots.
- Deployment instructions.
- Known limitations.
- Future improvements.

Include a suitable `.gitignore`.

Use clear Git commits with meaningful messages. Recommend small commits after completing and testing each phase.

Do not fabricate usage statistics, real customers, testimonials, or production deployment claims.

## 15. Development Workflow — Follow Strictly

Build the project in these phases:

### Phase 1: Requirements and Architecture
- Summarize requirements.
- Propose the database relationships.
- Propose the backend and frontend architecture.
- Identify major risks and decisions.
- Present the implementation plan.
- Do not generate the entire application immediately.

### Phase 2: Project Setup
- Create the frontend and backend.
- Configure npm scripts.
- Configure environment variables.
- Connect PostgreSQL and Prisma.
- Add a basic health-check endpoint.
- Verify that both applications start successfully.

### Phase 3: Authentication and Authorization
- Implement secure login and logout.
- Create authentication middleware.
- Create role-based authorization.
- Add the initial administrator seed process.
- Test protected endpoints.

### Phase 4: Student Management
- Implement the student schema and migrations.
- Build the student API.
- Test validation, uniqueness, pagination, and permissions.
- Build the student list, details, create, and edit interfaces.
- Integrate the frontend with the real API.

### Phase 5: Course Management
- Implement course models and APIs.
- Build the course interfaces.
- Implement instructor assignment and permissions.
- Test the relevant business rules.

### Phase 6: Enrolment
- Implement enrolment workflows.
- Enforce uniqueness and capacity constraints.
- Build student-course relationships in the interface.
- Test concurrent or conflicting enrolment scenarios where practical.

### Phase 7: Attendance
- Implement attendance APIs and business rules.
- Build the attendance interface.
- Add attendance statistics.
- Test duplicate prevention and correction permissions.

### Phase 8: Dashboard and Activity
- Implement database-backed statistics.
- Add recent activity.
- Verify that dashboard figures match the underlying records.

### Phase 9: Quality Assurance
- Run frontend and backend tests.
- Resolve build errors and runtime errors.
- Test validation, authorization, loading states, and error states.
- Check mobile responsiveness and accessibility.
- Review security and configuration.

### Phase 10: Deployment
- Prepare production configuration.
- Deploy the frontend, backend, and PostgreSQL database.
- Configure environment variables and CORS.
- Apply production migrations safely.
- Verify the deployed application.
- Document the live URLs only after successful deployment.

## 16. Rules for Working With Me

1. Teach through implementation. Explain important Node.js, Express, Prisma, and backend concepts when they first appear.
2. Work phase by phase. Do not skip ahead without completing and verifying the current phase.
3. Before writing code, state which files will be created or modified.
4. Provide complete code for each file you ask me to create or replace.
5. Do not provide snippets that depend on missing functions, imports, or configuration.
6. After each major step, provide the exact commands to run in Windows PowerShell.
7. Explain the expected output and how to verify that the step worked.
8. When an error occurs, diagnose the underlying cause before proposing a fix.
9. Do not silently change the agreed architecture or technology stack.
10. Do not introduce Docker, Redis, microservices, GraphQL, or unnecessary infrastructure unless there is a clear reason and I approve it.
11. Do not use Node.js frameworks other than Express for the initial version.
12. Use realistic sample data that is clearly fictional.
13. Never claim a feature, test, migration, or deployment is complete without verification.
14. Avoid unnecessary complexity. This is a serious junior-developer portfolio project, not an enterprise system that needs every possible feature.
15. At the end of each phase, provide a checklist of completed work, tests performed, known issues, and the next phase.
16. If an important decision is unclear, ask one focused question rather than making a major assumption.
17. Preserve working code and existing project structure when making changes.
18. Do not overwrite existing files or delete data without explaining the impact and obtaining my approval.

## 17. Definition of Done

The project is complete when:

- Authentication and role-based access work correctly.
- Administrators can manage students, courses, instructors, and enrolments.
- Instructors can manage attendance for assigned courses.
- Dashboard statistics reflect actual database data.
- Search, filtering, and pagination work.
- Forms have validation and clear feedback.
- The frontend and backend communicate through the REST API.
- Database migrations and seeding are repeatable.
- Important backend rules have automated tests.
- The application builds and runs without unresolved critical errors.
- Security controls have been tested.
- The application has been deployed and verified.
- The README is sufficient for another developer to run the project.
- The GitHub repository is suitable for review by a recruiter.

## 18. First Instruction

Start with **Phase 1: Requirements and Architecture**.

First, summarize the system you intend to build, propose the database relationships, outline the project structure, and explain the development sequence.

Do not generate all application files yet.

Wait for my approval before moving into Phase 2.
