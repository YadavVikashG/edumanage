import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { PrintButton } from "@/app/components/print-button";

export const dynamic = "force-dynamic";

export default async function FeeReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
  await requireRole("ADMIN", "ACCOUNTANT");
  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { invoice: { include: { student: true, payments: true } } } });
  if (!payment) notFound();
  const paidTotal = payment.invoice.payments.reduce((total, item) => total + Number(item.amount), 0);
  const remaining = Math.max(Number(payment.invoice.amount) - paidTotal, 0);

  return (
    <main className="content students-page">
      <header className="topbar no-print"><div><Link className="back-link" href="/fees">← Fees</Link><p className="eyebrow">Payment receipt</p><h1>{payment.receiptNo}</h1></div><PrintButton /></header>
      <section className="panel id-card"><div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div><p className="eyebrow">Fee receipt</p><div className="student-table"><div className="student-row"><span>Admission number</span><strong>{payment.invoice.student.admissionNo}</strong></div><div className="student-row"><span>Student</span><strong>{payment.invoice.student.firstName} {payment.invoice.student.lastName}</strong></div><div className="student-row"><span>Invoice</span><strong>{payment.invoice.invoiceNo}</strong></div><div className="student-row"><span>Amount paid now</span><strong>${Number(payment.amount).toFixed(2)}</strong></div><div className="student-row"><span>Total paid</span><strong>${paidTotal.toFixed(2)}</strong></div><div className="student-row"><span>Remaining balance</span><strong>${remaining.toFixed(2)}</strong></div><div className="student-row"><span>Payment method</span><strong>{payment.method}</strong></div></div></section>
    </main>
  );
}