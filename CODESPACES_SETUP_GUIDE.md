# EduManage GitHub Codespaces Setup Guide

This guide explains how to run EduManage inside a GitHub Codespace after cloning or forking the repository.

## 1. What a Codespace provides

A Codespace is a cloud development computer with a terminal, editor, Node.js tooling, and Git. The repository files are inside the Codespace, but your database must still be reachable from it.

You can use:

- A hosted PostgreSQL database such as Neon, Supabase, Railway, or another provider.
- A PostgreSQL Docker container inside the Codespace, if Docker is available.

For a team, a separate development database per developer is safer than sharing one database.

## 2. Create the Codespace

1. Open `https://github.com/YadavVikashG/edumanage`.
2. Select **Code**.
3. Open the **Codespaces** tab.
4. Select **Create codespace on main**.
5. Wait for VS Code to load the repository.

If you forked the repository, create the Codespace from your fork instead. You need write access to push branches to your fork.

## 3. Check the tools

Open the integrated terminal and run:

```bash
node --version
npm --version
git --version
```

Node.js 20 or newer is recommended. The terminal should open in the repository directory. If it does not:

```bash
cd edumanage
```

## 4. Install dependencies

```bash
npm install
```

## 5. Configure the database

### Recommended: hosted PostgreSQL

Create or use your own development database and copy its PostgreSQL connection string. Do not use another person's connection string or commit it to GitHub.

### Optional: PostgreSQL with Docker

If Docker is available in the Codespace:

```bash
docker run --name edumanage-postgres \
  -e POSTGRES_USER=edumanage \
  -e POSTGRES_PASSWORD=edumanage \
  -e POSTGRES_DB=edumanage \
  -p 5432:5432 \
  -d postgres:16
```

For this container, use:

```env
DATABASE_URL="postgresql://edumanage:edumanage@localhost:5432/edumanage?schema=public"
```

The Docker database is local to that Codespace. If the Codespace is deleted, the container and its data may be lost unless you use persistent storage or a hosted database.

## 6. Create `.env` in the Codespace

From the project root:

```bash
cp .env.example .env
```

Edit the file in VS Code, or use the terminal editor. Set at least:

```env
DATABASE_URL="your-own-postgresql-connection-string"
AUTH_SECRET="your-own-random-secret"
```

Generate `AUTH_SECRET` in the Codespace:

```bash
openssl rand -base64 32
```

Never commit `.env`. It is ignored by Git, but still check `git status` before pushing. For shared or long-lived Codespaces, store secrets in GitHub Codespaces secrets or repository/environment secrets rather than publishing them in files.

## 7. Apply migrations and create an admin

Generate the Prisma client and apply the migrations:

```bash
npm run db:generate
npx prisma migrate deploy
```

Create an administrator. The password is used only for this command and is not written to the repository:

```bash
USER_EMAIL=admin@school.test USER_NAME="School Admin" USER_ROLE=ADMIN USER_PASSWORD='choose-a-strong-password' npm run db:create-user
```

Create a teacher for testing if needed:

```bash
USER_EMAIL=teacher@school.test USER_NAME="Maria Chen" USER_ROLE=TEACHER USER_PASSWORD='choose-a-strong-password' npm run db:create-user
```

Supported roles are `ADMIN`, `TEACHER`, `STUDENT`, and `ACCOUNTANT`.

## 8. Run the app and open it

Start the development server:

```bash
npm run dev
```

When Next.js reports that it is ready, open the **Ports** tab in VS Code and find port `3000`. Select the globe or forwarded URL to open the app in your browser.

Open the `/login` path on that forwarded URL and sign in with the account you created.

If port 3000 is busy:

```bash
npm run dev -- --port 3001
```

Then open port `3001` from the Ports tab.

The project already allows Codespaces origins in `next.config.ts`, which is required for forwarded Server Actions such as creating students.

## 9. Stop and restart the Codespace

Stop the Next.js process with `Ctrl+C`. Start it again later with:

```bash
npm run dev
```

Your repository files normally persist when the Codespace is stopped. A Docker database without a volume may not persist, so use a hosted database for important development data.

## 10. Verify the project

Run these checks in the Codespace terminal:

```bash
npm run lint
npm run build
npm run db:validate
```

If these commands pass, the application is ready for development.

## 11. How to add a new feature in a Codespace

Use a branch so the main branch stays stable:

```bash
git checkout -b feature/my-new-feature
```

Then follow this order:

1. Add or update the data model in `prisma/schema.prisma` if the feature stores data.
2. Create a migration with `npm run db:migrate`.
3. Add server-side actions in the feature folder, for example `src/app/reports/actions.ts`.
4. Protect actions with `requireRole` and validate all form input with Zod.
5. Add the page under `src/app/reports/page.tsx`.
6. Add navigation or links for the roles that should see the feature.
7. Test success, empty, invalid-input, unauthorized, and database-error states.
8. Run lint, build, and Prisma validation.
9. Review the diff, commit, and push the branch.

Useful project locations:

- `src/app/`: pages and feature folders
- `src/app/*/actions.ts`: server-side mutations
- `src/lib/auth-guards.ts`: session and role checks
- `src/lib/prisma.ts`: shared Prisma client
- `prisma/schema.prisma`: database models
- `prisma/migrations/`: checked-in schema migrations
- `src/app/globals.css`: shared styles

Example Git workflow:

```bash
git status
git diff
npm run lint
npm run build
git add .
git commit -m "feat: add my new feature"
git push -u origin feature/my-new-feature
```

## 12. Codespaces troubleshooting

### `P1001: Can't reach database server`

Check that the hosted database is online, the connection string is complete, and its network rules allow the Codespace. For Docker, run:

```bash
docker ps --filter name=edumanage-postgres
```

### `DATABASE_URL` is missing

Confirm that `.env` is in the project root next to `package.json`:

```bash
pwd
ls -la .env package.json
```

### Server Actions fail with an origin error

Open the application through the forwarded Codespaces URL shown in the Ports tab. Restart `npm run dev` after changing configuration. Do not use an old forwarded URL.

### The login page rejects the password

Check that the user was created against the same database in `DATABASE_URL`. Re-run the user command with the intended role and password.

### The app shows stale data

Stop and restart the development server, refresh the browser, and confirm that the correct database is configured.

### The Codespace has no Docker command

Use a hosted PostgreSQL database. Docker is optional for this project.

## 13. Security rules

- Do not commit `.env` or any secret.
- Use a different `AUTH_SECRET` for every environment.
- Never use real student data in a public repository or shared Codespace.
- Rotate database credentials that have been exposed.
- Run `npx prisma migrate deploy` for deployment, not `npm run db:migrate`.
