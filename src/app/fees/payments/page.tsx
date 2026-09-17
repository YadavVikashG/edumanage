import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { recordPayment } from "../actions";
import { requireRole } from "@/lib/auth-guards";
import { PaymentForm } from "../payment-form";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireRole("ADMIN", "ACCOUNTANT");
  const invoices = await prisma.feeInvoice.findMany({ include: { student: true, payments: true }, orderBy: { dueDate: "asc" } });
  const openInvoices = invoices.filter((invoice) => invoice.payments.reduce((total, payment) => total + Number(payment.amount), 0) < Number(invoice.amount));

  return (
    <main className="content students-page">
      <header className="topbar"><div><Link className="back-link" href="/fees">← Fees</Link><p className="eyebrow">Finance office</p><h1>Record payment</h1></div></header>
      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading"><div><p className="eyebrow">Balances</p><h2>Open invoices</h2></div></div>
          <div className="student-table">
            {openInvoices.length === 0 ? <div className="empty-state"><strong>No open balances</strong><span>Every invoice is fully paid.</span></div> : openInvoices.map((invoice) => {
              const paid = invoice.payments.reduce((total, payment) => total + Number(payment.amount), 0);
              return <div className="student-row" key={invoice.id}><span><b>{invoice.student.admissionNo}</b><small>{invoice.student.firstName} {invoice.student.lastName} · {invoice.invoiceNo}</small></span><span>Billed ${Number(invoice.amount).toFixed(2)}</span><span>Paid ${paid.toFixed(2)}</span><span>Due ${Math.max(Number(invoice.amount) - paid, 0).toFixed(2)}</span></div>;
            })}
          </div>
        </div>
        <div className="panel add-student-panel">
          <div className="panel-heading"><div><p className="eyebrow">New record</p><h2>Payment details</h2></div></div>
            <PaymentForm invoices={openInvoices.map((invoice) => ({ id: invoice.id, admissionNo: invoice.student.admissionNo, remaining: Math.max(Number(invoice.amount) - invoice.payments.reduce((total, payment) => total + Number(payment.amount), 0), 0) }))} action={recordPayment} />
        </div>
      </section>
    </main>
  );
}