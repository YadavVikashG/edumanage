# EduManage Local Setup Guide

This guide explains how to clone EduManage and run it on a Windows, macOS, or Linux computer.

## 1. What you need

Install these tools before starting:

- Git
- Node.js 20 or newer
- npm (included with Node.js)
- PostgreSQL 16 or a hosted PostgreSQL database
- OpenSSL, only if you need to generate a new authentication secret

Check the installed versions:

```bash
node --version
npm --version
git --version
psql --version
```

Node.js 20 or newer is recommended. Use the same major Node.js version in development and deployment.

## 2. Clone the repository

Open Terminal, PowerShell, or Git Bash and run:

```bash
git clone https://github.com/YadavVikashG/edumanage.git
cd edumanage
```

## 3. Install dependencies

```bash
npm install
```

This reads `package-lock.json`, so do not replace `npm install` with a different package manager unless you also understand the lockfile changes.

## 4. Create a PostgreSQL database

You can use PostgreSQL installed on your computer or a hosted PostgreSQL provider such as Neon, Supabase, Railway, or another trusted provider.

### Option A: local PostgreSQL

Create a database and user using your PostgreSQL tools. One example is:

```sql
CREATE USER edumanage WITH PASSWORD 'replace-with-a-strong-password';
CREATE DATABASE edumanage OWNER edumanage;
```

Your connection URL will usually look like this:

```text
postgresql://edumanage:replace-with-a-strong-password@localhost:5432/edumanage?schema=public
```

### Option B: hosted PostgreSQL

Create a database with your provider and copy its PostgreSQL connection string. Use the SSL option supplied by the provider, commonly `sslmode=require`.

Do not use the database URL from somebody else. Each developer should use their own development database.

## 5. Create the environment file

Copy the example file:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the placeholder values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
AUTH_SECRET="paste-a-long-random-secret-here"
```

Generate a secret on macOS or Linux:

```bash
openssl rand -base64 32
```

On Windows, generate a long random value with a password manager or another trusted random generator.

Important:

- Never commit `.env` to GitHub.
- Never paste database passwords or `AUTH_SECRET` into source files.
- Use a different `AUTH_SECRET` and database for production.
- The existing `.gitignore` already ignores `.env*` files.

## 6. Apply the database schema

For a fresh local database, apply the checked-in migrations:

```bash
npm run db:generate
npx prisma migrate deploy
```

`migrate deploy` applies existing migrations without creating new ones. It is the correct command for a clone or deployment.

For active schema development, use:

```bash
npm run db:migrate
```

That command creates a new migration after you edit `prisma/schema.prisma`. Do not use it against production without reviewing the migration first.

Check the schema if needed:

```bash
npm run db:validate
npx prisma studio
```

## 7. Create the first administrator

The application needs a user record before anyone can log in. Create one with environment variables passed only to this command:

```bash
USER_EMAIL=admin@school.test USER_NAME="School Admin" USER_ROLE=ADMIN USER_PASSWORD='choose-a-strong-password' npm run db:create-user
```

On Windows PowerShell:

```powershell
$env:USER_EMAIL="admin@school.test"
$env:USER_NAME="School Admin"
$env:USER_ROLE="ADMIN"
$env:USER_PASSWORD="choose-a-strong-password"
npm run db:create-user
```

Supported roles are `ADMIN`, `TEACHER`, `STUDENT`, and `ACCOUNTANT`.

Create additional development users in the same way. For example:

```bash
USER_EMAIL=teacher@school.test USER_NAME="Maria Chen" USER_ROLE=TEACHER USER_PASSWORD='choose-a-strong-password' npm run db:create-user
```

The command uses an upsert. Running it again for the same email updates that account's name, role, and password.

## 8. Start EduManage

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then visit `/login`.

Stop the server with `Ctrl+C`.

## 9. Quality checks

Run these before committing changes:

```bash
npm run lint
npm run build
npm run db:validate
```

If the app cannot connect to the database, check that `DATABASE_URL` is correct and that the database is running and reachable.

## 10. Common local problems

### `P1001: Can't reach database server`

Check the database process, hostname, port, firewall, password, and SSL options in `DATABASE_URL`.

### `Environment variable not found: DATABASE_URL`

Make sure `.env` exists in the project root, next to `package.json`, and contains `DATABASE_URL`.

### `Invalid or expired session`

Set `AUTH_SECRET` in `.env`, restart `npm run dev`, and sign in again.

### Port 3000 is already in use

Start Next.js on another port:

```bash
npm run dev -- --port 3001
```

Then open `http://localhost:3001`.

### Prisma client errors after changing the schema

Run:

```bash
npm run db:generate
npm run db:validate
```

## 11. How to develop a new feature

Follow the existing feature structure:

1. Decide which role may use the feature.
2. Add or update models and enums in `prisma/schema.prisma` if data is needed.
3. Create a migration with `npm run db:migrate`.
4. Add server mutations in the relevant `actions.ts` file using `requireRole`, Zod validation, Prisma, and `revalidatePath`.
5. Add the page or component under `src/app/<feature>/`.
6. Add navigation from the dashboard or the relevant role view.
7. Add loading, empty, validation, and error states.
8. Run `npm run lint`, `npm run build`, and `npm run db:validate`.
9. Commit the working change with a focused message.

Typical locations:

- Pages: `src/app/<feature>/page.tsx`
- Server actions: `src/app/<feature>/actions.ts`
- Shared database client: `src/lib/prisma.ts`
- Authentication guards: `src/lib/auth-guards.ts`
- Prisma schema: `prisma/schema.prisma`
- Database migrations: `prisma/migrations/`
- Shared styling: `src/app/globals.css`

Keep authorization on the server. Never trust a role, user ID, price, or permission sent by the browser. Validate form data with Zod before writing to the database.

## 12. Git workflow

Create a branch for a feature:

```bash
git checkout -b feature/attendance-report
```

Review your changes:

```bash
git status
git diff
```

Commit and push:

```bash
git add .
git commit -m "feat: add attendance report"
git push -u origin feature/attendance-report
```

Do not commit `.env`, passwords, database URLs, generated build output, or `node_modules`.
