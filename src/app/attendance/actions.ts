"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

const attendanceSchema = z.object({ studentId: z.string().cuid(), classId: z.string().cuid(), date: z.coerce.date(), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]), note: z.string().trim().max(200).optional() });

export async function markAttendance(formData: FormData) {
  const session = await requireRole("ADMIN", "TEACHER");
  const result = attendanceSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid attendance details.");
  if (session.user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { email: session.user.email ?? "" } });
    const assignment = teacher && await prisma.schoolClass.findFirst({ where: { id: result.data.classId, teacherId: teacher.id, enrollments: { some: { studentId: result.data.studentId } } } });
    if (!assignment) throw new Error("You can only mark attendance for students in your assigned classes.");
  }
  await prisma.attendanceRecord.upsert({ where: { studentId_classId_date: { studentId: result.data.studentId, classId: result.data.classId, date: result.data.date } }, update: { status: result.data.status, note: result.data.note }, create: result.data });
  revalidatePath("/attendance");
  redirect("/attendance");
}