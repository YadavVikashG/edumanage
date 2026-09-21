# EduManage Setup Guide

This is the quick starting guide for anyone who clones EduManage. Choose the setup method that matches your computer:

- [Run on a local machine](LOCAL_SETUP_GUIDE.md)
- [Run in GitHub Codespaces](CODESPACES_SETUP_GUIDE.md)

## Quick setup checklist

1. Clone the repository or open it in a Codespace.
2. Install Node.js 20 or newer.
3. Run `npm install`.
4. Create your own PostgreSQL database.
5. Copy `.env.example` to `.env`.
6. Set `DATABASE_URL` and a new `AUTH_SECRET` in `.env`.
7. Run the Prisma migrations.
8. Create an administrator account.
9. Start the development server.

## Commands used by both setup methods

```bash
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:validate
npm run dev
```

Open the application at `http://localhost:3000` on a local machine. In Codespaces, open port `3000` from the VS Code **Ports** tab.

## Environment variables

Create `.env` in the project root, next to `package.json`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
AUTH_SECRET="generate-a-long-random-secret"
```

Generate a secret on macOS, Linux, or Codespaces:

```bash
openssl rand -base64 32
```

Do not commit `.env`, database passwords, or authentication secrets. Each developer should use their own development database.

## Create the first admin user

Run this from the project root. Replace the example values with your own values:

```bash
USER_EMAIL=admin@school.test USER_NAME="School Admin" USER_ROLE=ADMIN USER_PASSWORD='choose-a-strong-password' npm run db:create-user
```

Supported roles:

- `ADMIN`
- `TEACHER`
- `STUDENT`
- `ACCOUNTANT`

The same command can create test teacher or student accounts by changing `USER_ROLE` and the other values.

## How to develop a new feature

Use a feature branch:

```bash
git checkout -b feature/my-new-feature
```

Follow this order:

1. Add or update the data model in `prisma/schema.prisma` when the feature needs database data.
2. Create a migration with `npm run db:migrate`.
3. Add server-side mutations in `src/app/<feature>/actions.ts`.
4. Validate form input with Zod.
5. Protect mutations with `requireRole` from `src/lib/auth-guards.ts`.
6. Add the page in `src/app/<feature>/page.tsx`.
7. Add navigation and useful empty, loading, validation, and error states.
8. Run the quality checks.

Common project locations:

- Pages and features: `src/app/`
- Server actions: `src/app/*/actions.ts`
- Authentication guards: `src/lib/auth-guards.ts`
- Prisma client: `src/lib/prisma.ts`
- Database models: `prisma/schema.prisma`
- Database migrations: `prisma/migrations/`
- Shared styles: `src/app/globals.css`

Always make authorization and validation decisions on the server. Never trust IDs, roles, prices, or permissions sent by the browser.

## Quality checks before committing

```bash
npm run lint
npm run build
npm run db:validate
git diff --check
```

Review the files before committing:

```bash
git status
git diff
```

Commit and push your feature branch:

```bash
git add .
git commit -m "feat: describe the feature"
git push -u origin feature/my-new-feature
```

For database or authentication changes, test the affected role and verify that unauthorized users cannot access the new feature.

## Important security rules

- Never commit `.env`.
- Never use real student information in development.
- Use a different `AUTH_SECRET` for every environment.
- Use `npx prisma migrate deploy` for deployment.
- Use `npm run db:migrate` only when developing and reviewing a new migration.
- Rotate any credential that is accidentally exposed.
