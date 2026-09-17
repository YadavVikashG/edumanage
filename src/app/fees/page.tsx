import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "./actions";
import { requireRole } from "@/lib/auth-guards";
import { updateClassFee } from "@/app/classes/actions";

export const dynamic = "force-dynamic";

export default async function FeesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireRole("ADMIN", "ACCOUNTANT");
  const { error } = await searchParams;
  const [invoices, students, classes] = await prisma.$transaction([
    prisma.feeInvoice.findMany({ include: { student: true, payments: true }, orderBy: { dueDate: "asc" }, take: 100 }),
    prisma.student.findMany({ where: { status: "ACTIVE" }, orderBy: { lastName: "asc" } }),
    prisma.schoolClass.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
  ]);

  return (
    <main className="content students-page">
      <header className="topbar"><div><Link className="back-link" href="/">← Overview</Link><p className="eyebrow">Finance office</p><h1>Fees & payments</h1></div><Link className="primary-button" href="#add-invoice">+ <span>Create fee invoice</span></Link></header>
      {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}
      <section className="directory-layout">
        <div className="panel student-list-panel"><div className="panel-heading"><div><p className="eyebrow">Student fee ledger</p><h2>{invoices.length} invoices</h2></div><Link className="text-button" href="/fees/payments">Record payment <span>→</span></Link></div><div className="student-table"><div className="student-row fees-row student-head"><span>Admission / invoice</span><span>Student</span><span>Billed / paid</span><span>Remaining</span></div>{invoices.length === 0 ? <div className="empty-state"><strong>No invoices yet</strong><span>Create a fee using a student admission number.</span></div> : invoices.map((invoice) => { const paid = invoice.payments.reduce((total, payment) => total + Number(payment.amount), 0); return <div className="student-row fees-row" key={invoice.id}><span><b>{invoice.student.admissionNo}</b><small>{invoice.invoiceNo}</small></span><span>{invoice.student.firstName} {invoice.student.lastName}</span><span><b>${Number(invoice.amount).toFixed(2)}</b><small>Paid ${paid.toFixed(2)}</small></span><span><b>${Math.max(Number(invoice.amount) - paid, 0).toFixed(2)}</b><small>{invoice.status}</small></span></div>; })}</div></div>
        <div className="panel add-student-panel" id="add-invoice"><div className="panel-heading"><div><p className="eyebrow">New fee</p><h2>Create invoice</h2></div></div><form action={createInvoice} className="student-form"><label>Student admission number<input name="admissionNo" list="student-admissions" required placeholder="ADM-2026-0001" /></label><datalist id="student-admissions">{students.map((student) => <option key={student.id} value={student.admissionNo}>{student.firstName} {student.lastName}</option>)}</datalist><p className="field-help">The invoice number and default fee use the student admission number and class fee.</p><label>Description<input name="description" required defaultValue="Class fee" /></label><label>Amount override <span className="field-help">Required when the class has no fee</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="Example: 10000" /></label><label>Due date<input name="dueDate" type="date" /></label><button className="primary-button form-submit" type="submit">Create fee invoice</button></form></div>
      </section>
      {session.user.role === "ADMIN" && <section className="panel" style={{ marginTop: 14 }}><div className="panel-heading"><div><p className="eyebrow">Class tuition settings</p><h2>Set or update class fees</h2></div></div><p className="field-help">Applying a fee enrolls matching existing students and creates missing tuition invoices. Previous payments are preserved.</p><div className="student-table">{classes.map((item) => <form action={updateClassFee} className="student-row" key={item.id}><input type="hidden" name="classId" value={item.id} /><span><b>{item.name}</b><small>{item.grade} · Division {item.section ?? "—"}</small></span><span>{item._count.enrollments} students</span><span><input name="feeAmount" type="number" min="0" step="0.01" required defaultValue={item.feeAmount ? Number(item.feeAmount) : ""} placeholder="Set fee" /></span><button className="primary-button" type="submit">Apply fee</button></form>)}</div></section>}
    </main>
  );
}