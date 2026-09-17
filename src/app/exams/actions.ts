"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

const examSchema = z.object({ name: z.string().trim().min(2).max(80), subject: z.string().trim().min(2).max(60), date: z.coerce.date(), room: z.string().trim().max(30).optional(), classId: z.string().cuid() });

export async function createExam(formData: FormData) {
  const session = await requireRole("ADMIN", "TEACHER");
  const result = examSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid exam details.");
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { email: session.user.email ?? "" } });
    const assignment = teacher && await prisma.schoolClass.findFirst({ where: { id: result.data.classId, teacherId: teacher.id } });
    if (!assignment) throw new Error("You can only create exams for your assigned classes.");
  }
  await prisma.exam.create({ data: result.data });
  revalidatePath("/exams");
  redirect("/exams");
}