"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

const optionalAmount = z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().positive().finite().optional());
const invoiceSchema = z.object({ admissionNo: z.string().trim().min(2).max(40), description: z.string().trim().min(2).max(100), amount: optionalAmount, dueDate: z.coerce.date().optional().or(z.literal("")) });
const paymentSchema = z.object({ invoiceId: z.string().cuid(), amount: z.coerce.number().positive().finite(), method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE"]), reference: z.string().trim().max(80).optional() });

export async function createInvoice(formData: FormData) {
  await requireRole("ADMIN", "ACCOUNTANT");
  const result = invoiceSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid invoice details.");
  const student = await prisma.student.findUnique({ where: { admissionNo: result.data.admissionNo }, include: { enrollments: { include: { class: true }, take: 1 } } });
  if (!student) redirect(`/fees?error=${encodeURIComponent("No student was found with that admission number.")}`);
  const classNumber = student.grade.replace(/^Class |^Grade |^grade /, "");
  const matchingClass = student.enrollments[0]?.class ?? await prisma.schoolClass.findFirst({ where: { section: student.section, OR: [{ grade: student.grade }, { grade: `Class ${classNumber}` }, { grade: `Grade ${classNumber}` }, { grade: `grade ${classNumber}` }] } });
  const classFee = matchingClass?.feeAmount;
  const amount = result.data.amount === undefined ? Number(classFee ?? 0) : result.data.amount;
  if (amount <= 0) redirect(`/fees?error=${encodeURIComponent("This class has no fee configured. Enter an amount or set the class fee below.")}`);
  const invoiceCount = await prisma.feeInvoice.count({ where: { studentId: student.id } });
  const invoiceNo = `${student.admissionNo}-FEE-${String(invoiceCount + 1).padStart(3, "0")}`;
  const dueDate = result.data.dueDate instanceof Date ? result.data.dueDate : new Date();
  await prisma.feeInvoice.create({ data: { invoiceNo, studentId: student.id, description: result.data.description, amount, dueDate } });
  revalidatePath("/fees");
  redirect("/fees");
}

export async function recordPayment(formData: FormData) {
  await requireRole("ADMIN", "ACCOUNTANT");
  const result = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) throw new Error("Please enter valid payment details.");

  const invoice = await prisma.feeInvoice.findUnique({ where: { id: result.data.invoiceId }, include: { payments: true, student: true } });
  if (!invoice) throw new Error("Invoice not found.");
  const paid = invoice.payments.reduce((total, payment) => total + Number(payment.amount), 0);
  const remaining = Number(invoice.amount) - paid;
  if (result.data.amount > remaining) throw new Error("Payment cannot be greater than the remaining balance.");

  let paymentId = "";
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({ data: { ...result.data, receiptNo: `RCPT-${new Date().getFullYear()}-${Date.now()}` } });
    paymentId = payment.id;
    await tx.feeInvoice.update({ where: { id: invoice.id }, data: { status: result.data.amount === remaining ? "PAID" : "PARTIAL" } });
  });
  revalidatePath("/fees");
  revalidatePath("/student");
  redirect(`/fees/receipts/${paymentId}`);
}