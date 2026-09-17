"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SCHOOL_DIVISIONS, SCHOOL_GRADES } from "@/lib/school-options";

const studentSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional(),
  grade: z.enum(SCHOOL_GRADES as [string, ...string[]]),
  section: z.enum(SCHOOL_DIVISIONS),
  password: z.string().min(8).max(100),
});

export async function createStudent(formData: FormData) {
  await requireRole("ADMIN", "TEACHER");

  const result = studentSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid student details.");

  const { password, ...studentData } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const classNumber = studentData.grade.replace("Class ", "");
    const schoolClass = await tx.schoolClass.findFirst({
      where: {
        section: studentData.section,
        OR: [
          { grade: studentData.grade },
          { grade: `Grade ${classNumber}` },
          { grade: `grade ${classNumber}` },
        ],
      },
      orderBy: { academicYear: "desc" },
    });
    const existingStudents = await tx.student.findMany({
      select: { admissionNo: true },
    });
    const nextAdmissionNumber = existingStudents.reduce((highest, student) => {
      const match = student.admissionNo.match(/(\d+)$/);
      const number = match ? Number.parseInt(match[1], 10) : 0;
      return Number.isFinite(number) ? Math.max(highest, number) : highest;
    }, 0) + 1;
    const admissionNo = `ADM-${new Date().getFullYear()}-${String(nextAdmissionNumber).padStart(4, "0")}`;
    const classmates = await tx.student.findMany({
      where: {
        section: studentData.section,
        OR: [
          { grade: studentData.grade },
          { grade: `Grade ${classNumber}` },
          { grade: `grade ${classNumber}` },
        ],
      },
      select: { rollNo: true },
    });
    const highestRollNo = classmates.reduce((highest, student) => {
      const rollNo = Number.parseInt(student.rollNo ?? "", 10);
      return Number.isFinite(rollNo) ? Math.max(highest, rollNo) : highest;
    }, 0);
    const nextRollNo = Math.max(highestRollNo, classmates.length) + 1;

    const student = await tx.student.create({ data: { ...studentData, admissionNo, rollNo: String(nextRollNo) } });
    if (schoolClass) {
      await tx.enrollment.create({ data: { studentId: student.id, classId: schoolClass.id } });
      if (schoolClass.feeAmount && Number(schoolClass.feeAmount) > 0) {
        await tx.feeInvoice.create({
          data: {
            invoiceNo: `${admissionNo}-FEE-001`,
            studentId: student.id,
            description: `Tuition fee - ${schoolClass.name}`,
            amount: schoolClass.feeAmount,
            dueDate: new Date(),
          },
        });
      }
    }
    await tx.user.upsert({
      where: { email: studentData.email },
      update: { name: `${studentData.firstName} ${studentData.lastName}`, passwordHash, role: "STUDENT" },
      create: { email: studentData.email, name: `${studentData.firstName} ${studentData.lastName}`, passwordHash, role: "STUDENT" },
    });
  });
  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath("/fees");
  revalidatePath("/classes");
  redirect("/students");
}