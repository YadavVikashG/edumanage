# EduManage Build Guide

This is the working plan for completing the student management system in small, verifiable steps. Run the check at the end of every phase before moving on. When a command fails, keep the error output and fix that phase before adding another feature.

## 0. Prerequisites

Use a Codespace with Node.js 20 or newer, npm, and Git. Verify:

```bash
node --version
npm --version
git --version
```

Start the current UI:

```bash
cd edumanage
npm install
npm run dev
```

Open port 3000 from the Ports tab. Verify that the dashboard loads on desktop and mobile width. Stop the server with `Ctrl+C`.

## 1. Create a Git checkpoint

```bash
git init
git add .
git commit -m "chore: scaffold EduManage dashboard"
```

Make a new commit after each working feature. This gives you a clean rollback point when a database migration or auth change goes wrong.

## 2. Add PostgreSQL

Create a free local or hosted PostgreSQL database. In Codespaces, a Docker database is convenient:

```bash
docker run --name edumanage-postgres -e POSTGRES_USER=edumanage -e POSTGRES_PASSWORD=edumanage -e POSTGRES_DB=edumanage -p 5432:5432 -d postgres:16
```

Create `edumanage/.env`:

```env
DATABASE_URL="postgresql://edumanage:edumanage@localhost:5432/edumanage?schema=public"
```

Do not commit `.env`. Check that the container is running:

```bash
docker ps --filter name=edumanage-postgres
```

## 3. Add Prisma and the first data model

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init --datasource-provider postgresql
```

In `prisma/schema.prisma`, add models in this order: `User`, `Student`, `Teacher`, `Class`, `Enrollment`, `AttendanceRecord`, `Exam`, `FeeInvoice`, and `Payment`. Use enums for `Role`, `AttendanceStatus`, `InvoiceStatus`, and `PaymentMethod`. Put `createdAt` and `updatedAt` on every mutable model.

Run and verify the first migration:

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
```

The Studio page should open with the tables visible. If migration fails, check `DATABASE_URL`, that PostgreSQL is running, and that port 5432 is free.

## 4. Add a database client

Create `src/lib/prisma.ts` with one shared `PrismaClient` instance. In development, store it on `globalThis` so hot reload does not open a new database connection on every edit. Export the client as `prisma`.

Check the client from a temporary server action or route handler, then remove the temporary check:

```bash
npx prisma validate
npx tsc --noEmit
```

## 5. Add authentication and roles

Install Auth.js:

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

Add `AUTH_SECRET` to `.env` with `openssl rand -base64 32`. Implement credentials login first, then add Google or Microsoft login only after the local flow works. Store the role in the session and protect routes in `src/proxy.ts` or the current Next.js middleware convention.

Required roles: `ADMIN`, `TEACHER`, `STUDENT`, and `ACCOUNTANT`. Test each role with a separate seeded user. A student must never be able to request another student's private records.

## 6. Build features in this order

### Students

Add list, search, filter, create, edit, profile, enrollment history, guardian contact, and document upload. Validate email, phone, date of birth, and required enrollment fields on the server with Zod.

### Teachers and classes

Add teacher profiles, subjects, class assignments, timetable, and class roster. Only admins should create or delete assignments; teachers can edit their own class notes.

### Attendance

Add a teacher-facing daily register and an admin report. Prevent duplicate records for the same student, class, and date with a database constraint. Show attendance percentage and flag values below the configured threshold.

### Examinations

Add exam schedules, room allocation, subjects, marks entry, grading rules, and published report cards. Keep marks private until an admin publishes the result.

### Fees

Add invoice generation, discounts, payment recording, outstanding balance, receipts, and export. Treat payments as append-only records; corrections should be reversals, never destructive edits.

### Academic records

Add a student timeline that combines enrollment, attendance, exam results, teacher notes, invoices, and payments. Keep the read model server-side and paginate it.

## 7. API and validation conventions

Use Server Actions for forms that belong to the app and Route Handlers for integrations or external clients. Every mutation should:

1. Check the authenticated user's role.
2. Validate input with Zod.
3. Perform the write in Prisma.
4. Revalidate the affected path.
5. Return a typed success or error result.

Never trust IDs, roles, totals, or permissions from the browser. Recalculate fee totals and authorization decisions on the server.

## 8. Seed realistic development data

Create `prisma/seed.ts` with one admin, two teachers, three classes, 20 students, attendance for two weeks, three exams, invoices, and payments. Add a seed script to `package.json`, then run:

```bash
npx prisma db seed
```

Use obviously fake names and emails. Never use production student information in development.

## 9. Testing and quality gates

Install the test tools when the first data feature lands:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

Minimum tests: role authorization, student creation validation, duplicate attendance prevention, invoice balance calculation, and a login-to-dashboard browser flow. Before every commit run:

```bash
npm run lint
npm run build
npx tsc --noEmit
```

## 10. Deployment

Use a managed PostgreSQL provider and set `DATABASE_URL`, `AUTH_SECRET`, and OAuth credentials in the hosting provider's environment settings. Run migrations during deployment with `npx prisma migrate deploy`, never `migrate dev`. Confirm backups, TLS, error logging, and a least-privilege database user before adding real student data.

## Current implementation status

The Neon connection, Prisma migrations, live dashboard count, and database-backed student, teacher, class, attendance, examination, and fee routes are complete. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the estimated completion percentage and remaining modules.

## Suggested next coding milestone

The next implementation slice should be Prisma plus the `Student` model and a server-rendered students list. Keep the dashboard mock data until the database query is working, then replace one card at a time. Verify the migration, seed data, list query, role check, and production build before starting attendance.