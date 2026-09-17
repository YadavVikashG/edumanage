# EduManage Authentication

EduManage uses Auth.js credentials authentication. Every application page requires a session. Mutations are role protected:

- `ADMIN`: students, teachers, classes, exams, attendance, and invoices.
- `TEACHER`: attendance and exam scheduling.
- `ACCOUNTANT`: invoices.
- `STUDENT`: login and read-only access after the student dashboard is added.

## Create accounts

Run these commands from `edumanage`. Type your real password directly into the terminal; do not commit it to `.env` or source control.

```bash
USER_EMAIL=admin@school.test USER_NAME="School Admin" USER_ROLE=ADMIN USER_PASSWORD='choose-a-password' npm run db:create-user
USER_EMAIL=teacher@school.test USER_NAME="Maria Chen" USER_ROLE=TEACHER USER_PASSWORD='choose-a-password' npm run db:create-user
USER_EMAIL=student@school.test USER_NAME="Jordan Lee" USER_ROLE=STUDENT USER_PASSWORD='choose-a-password' npm run db:create-user
```

The command uses an upsert, so rerunning it updates the password and role for that email. Then start the app:

```bash
npm run dev
```

Open `http://localhost:3000/login`. Use the matching email and password. A user without the required role is redirected to `/unauthorized` when opening a restricted area.

## Codespaces note

Use the forwarded Codespaces URL from the Ports tab. `next.config.ts` allows the `*.app.github.dev` origin so forwarded Server Actions, including Add Student, are accepted.

## Security

Set a new random `AUTH_SECRET` before deployment:

```bash
openssl rand -base64 32
```

The database password previously shared in chat must also be rotated in Neon.