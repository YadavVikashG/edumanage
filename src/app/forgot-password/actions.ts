"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

const resetSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["STUDENT", "TEACHER"]),
  identity: z.string().trim().min(2).max(40),
  oldPassword: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function resetPassword(formData: FormData) {
  const result = resetSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Enter valid recovery details and a password of at least 8 characters.");

  const email = result.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(result.data.oldPassword, user.passwordHash))) throw new Error("The current password is incorrect.");
  if (user.role !== result.data.role) throw new Error("The selected account type does not match this login.");
  const profile = result.data.role === "STUDENT"
    ? await prisma.student.findFirst({ where: { email, admissionNo: result.data.identity } })
    : await prisma.teacher.findFirst({ where: { email, employeeNo: result.data.identity } });
  if (!profile) throw new Error("The email and identity number do not match our records.");

  const passwordHash = await bcrypt.hash(result.data.password, 12);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
}

const managedResetSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER"]),
  identity: z.string().trim().min(2).max(40),
  password: z.string().min(8).max(100),
});

export async function resetManagedPassword(formData: FormData) {
  const session = await requireRole("ADMIN", "TEACHER");
  const result = managedResetSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Enter a valid account number and password of at least 8 characters.");
  if (session.user.role === "TEACHER" && result.data.role !== "STUDENT") throw new Error("Teachers can reset student passwords only.");

  const email = result.data.role === "STUDENT"
    ? (await prisma.student.findUnique({ where: { admissionNo: result.data.identity }, select: { email: true } }))?.email
    : (await prisma.teacher.findUnique({ where: { employeeNo: result.data.identity }, select: { email: true } }))?.email;
  if (!email) throw new Error("No matching student or teacher account was found.");

  const passwordHash = await bcrypt.hash(result.data.password, 12);
  const account = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!account || account.role !== result.data.role) throw new Error("This person does not have a matching login account.");
  await prisma.user.update({ where: { id: account.id }, data: { passwordHash } });
}