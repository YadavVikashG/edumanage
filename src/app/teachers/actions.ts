"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { STANDARD_SUBJECTS } from "@/lib/subjects";

const teacherSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(60).refine((value) => STANDARD_SUBJECTS.includes(value as (typeof STANDARD_SUBJECTS)[number]) || value.length >= 2),
  password: z.string().min(8).max(100),
});

export async function createTeacher(formData: FormData) {
  await requireRole("ADMIN");
  const result = teacherSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid teacher details.");
  const { password, ...teacherData } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const teachers = await tx.teacher.findMany({ select: { employeeNo: true } });
    const highestEmployeeNumber = teachers.reduce((highest, teacher) => {
      const match = teacher.employeeNo.match(/(\d+)$/);
      const number = match ? Number.parseInt(match[1], 10) : 0;
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0);
    const employeeNo = `EMP-${new Date().getFullYear()}-${String(Math.max(highestEmployeeNumber, teachers.length) + 1).padStart(4, "0")}`;
    await tx.teacher.create({ data: { ...teacherData, employeeNo } });
    await tx.user.upsert({
      where: { email: teacherData.email },
      update: { name: `${teacherData.firstName} ${teacherData.lastName}`, passwordHash, role: "TEACHER" },
      create: { email: teacherData.email, name: `${teacherData.firstName} ${teacherData.lastName}`, passwordHash, role: "TEACHER" },
    });
  });
  revalidatePath("/teachers");
  redirect("/teachers");
}