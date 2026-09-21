# EduManage

EduManage is a full-stack student management system for students, teachers, attendance, examinations, fees, and academic records. The current milestone is a responsive dashboard shell built with Next.js, TypeScript, and Tailwind CSS.

## Run the dashboard

```bash
cd edumanage
npm install
npm run dev
```

Open `http://localhost:3000` in your Codespace. Visit `http://localhost:3000/login` to sign in, then use the dashboard routes. Create accounts with the instructions in [AUTHENTICATION.md](AUTHENTICATION.md). For the implementation plan, read [BUILD_GUIDE.md](BUILD_GUIDE.md); for the exact completed and remaining work, read [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Setup guides

- [Local machine setup](LOCAL_SETUP_GUIDE.md) - clone and run EduManage on Windows, macOS, or Linux.
- [GitHub Codespaces setup](CODESPACES_SETUP_GUIDE.md) - run EduManage in a Codespace, configure the database, open the forwarded port, and develop new features.

## Current stack

- Next.js App Router and TypeScript
- Tailwind CSS v4 for the initial styling layer
- Planned: Node.js route handlers, PostgreSQL, Prisma, and Auth.js

## Useful commands

```bash
npm run lint
npm run build
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
