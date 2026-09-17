import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.USER_EMAIL?.trim().toLowerCase();
  const password = process.env.USER_PASSWORD;
  const name = process.env.USER_NAME?.trim();
  const role = process.env.USER_ROLE as UserRole | undefined;
  if (!email || !password || !name || !role || !Object.values(UserRole).includes(role)) {
    throw new Error("Set USER_EMAIL, USER_PASSWORD, USER_NAME, and USER_ROLE (ADMIN, TEACHER, STUDENT, or ACCOUNTANT).");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({ where: { email }, update: { name, passwordHash, role }, create: { email, name, passwordHash, role } });
  console.log(`${role} account ready for ${email}`);
}

main().finally(() => prisma.$disconnect());