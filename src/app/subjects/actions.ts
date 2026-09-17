"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SCHOOL_GRADES } from "@/lib/school-options";

const subjectSchema = z.object({
  name: z.string().trim().min(2).max(60),
  grade: z.enum(SCHOOL_GRADES as [string, ...string[]]),
  classId: z.string().cuid(),
});

export async function createSubject(formData: FormData) {
  const session = await requireRole("ADMIN", "TEACHER");
  const result = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Enter a subject, class, and grade.");

  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { email: session.user.email ?? "" } });
    const assignedClass = teacher && await prisma.schoolClass.findFirst({ where: { id: result.data.classId, teacherId: teacher.id } });
    if (!assignedClass) throw new Error("You can only add subjects to your assigned classes.");
  }

  const schoolClass = await prisma.schoolClass.findUnique({ where: { id: result.data.classId }, select: { grade: true } });
  if (!schoolClass || schoolClass.grade !== result.data.grade) throw new Error("The selected class and grade do not match.");

  await prisma.$transaction(async (tx) => {
    const subject = await tx.subject.upsert({
      where: { name_grade: { name: result.data.name, grade: result.data.grade } },
      update: {},
      create: { name: result.data.name, grade: result.data.grade },
    });
    await tx.classSubject.upsert({
      where: { classId_subjectId: { classId: result.data.classId, subjectId: subject.id } },
      update: {},
      create: { classId: result.data.classId, subjectId: subject.id },
    });
  });
  revalidatePath("/subjects");
  revalidatePath("/classes");
  redirect("/subjects");
}