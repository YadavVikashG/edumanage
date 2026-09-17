"use client";

import { useState } from "react";

type PaymentOption = { id: string; admissionNo: string; remaining: number };
type PaymentAction = (formData: FormData) => void | Promise<void>;

export function PaymentForm({ invoices, action }: { invoices: PaymentOption[]; action: PaymentAction }) {
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const selected = invoices.find((invoice) => invoice.id === selectedId);

  return (
    <form action={action} className="student-form">
      <label>Student admission number<select name="invoiceId" required value={selectedId} onChange={(event) => { const id = event.target.value; setSelectedId(id); const invoice = invoices.find((item) => item.id === id); setAmount(invoice ? invoice.remaining.toFixed(2) : ""); }}><option value="" disabled>Select admission number</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.admissionNo} · Remaining ${invoice.remaining.toFixed(2)}</option>)}</select></label>
      <label>Amount paid<input name="amount" type="number" min="0.01" max={selected?.remaining} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      <p className="field-help">The amount fills with the current balance. Change it for a partial payment.</p>
      <label>Method<select name="method" defaultValue="CASH"><option value="CASH">Cash</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="ONLINE">Online</option></select></label>
      <label>Reference<input name="reference" placeholder="Receipt or transaction number" /></label>
      <button className="primary-button form-submit" type="submit">Create receipt</button>
    </form>
  );
}