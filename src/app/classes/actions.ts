"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SCHOOL_DIVISIONS, SCHOOL_GRADES } from "@/lib/school-options";

const optionalFee = z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().nonnegative().finite().optional());
const classSchema = z.object({ grade: z.enum(SCHOOL_GRADES as [string, ...string[]]), section: z.enum(SCHOOL_DIVISIONS), academicYear: z.string().trim().min(4).max(20), feeAmount: optionalFee, teacherId: z.string().cuid().optional().or(z.literal("")) });

export async function createClass(formData: FormData) {
  await requireRole("ADMIN");
  const result = classSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid class details.");
  const { grade, section, teacherId, academicYear, feeAmount } = result.data;
  await prisma.schoolClass.create({ data: { name: `${grade} - Division ${section}`, grade, section, academicYear, feeAmount: feeAmount ?? null, teacherId: teacherId || null } });
  revalidatePath("/classes");
  redirect("/classes");
}

export async function updateClassFee(formData: FormData) {
  const session = await requireRole("ADMIN");
  void session;
  const result = z.object({ classId: z.string().cuid(), feeAmount: z.coerce.number().nonnegative().finite() }).safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Enter a valid class fee.");
  await prisma.$transaction(async (tx) => {
    const schoolClass = await tx.schoolClass.update({ where: { id: result.data.classId }, data: { feeAmount: result.data.feeAmount } });
    const classNumber = schoolClass.grade.replace(/^Class |^Grade |^grade /, "");
    const students = await tx.student.findMany({
      where: {
        section: schoolClass.section,
        OR: [
          { grade: schoolClass.grade },
          { grade: `Class ${classNumber}` },
          { grade: `Grade ${classNumber}` },
          { grade: `grade ${classNumber}` },
        ],
      },
    });
    for (const student of students) {
      await tx.enrollment.upsert({ where: { studentId_classId: { studentId: student.id, classId: schoolClass.id } }, update: {}, create: { studentId: student.id, classId: schoolClass.id } });
      const openInvoice = await tx.feeInvoice.findFirst({ where: { studentId: student.id, status: { in: ["PENDING", "PARTIAL"] } }, include: { payments: true }, orderBy: { createdAt: "desc" } });
      if (openInvoice) {
        const paid = openInvoice.payments.reduce((total, payment) => total + Number(payment.amount), 0);
        if (result.data.feeAmount >= paid) await tx.feeInvoice.update({ where: { id: openInvoice.id }, data: { amount: result.data.feeAmount } });
      } else {
        const invoiceCount = await tx.feeInvoice.count({ where: { studentId: student.id } });
        await tx.feeInvoice.create({ data: { invoiceNo: `${student.admissionNo}-FEE-${String(invoiceCount + 1).padStart(3, "0")}`, studentId: student.id, description: `Tuition fee - ${schoolClass.name}`, amount: result.data.feeAmount, dueDate: new Date() } });
      }
    }
  });
  revalidatePath("/classes");
  revalidatePath("/fees");
  redirect(`/classes/${result.data.classId}`);
}