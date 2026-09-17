import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { PrintButton } from "@/app/components/print-button";

export const dynamic = "force-dynamic";

export default async function StudentIdCardPage({ params }: { params: Promise<{ studentId: string }> }) {
  await requireRole("ADMIN", "TEACHER");
  const { studentId } = await params;
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { enrollments: { include: { class: true }, take: 1 } } });
  if (!student) notFound();
  const enrollment = student.enrollments[0];

  return (
    <main className="content students-page">
      <header className="topbar no-print"><div><Link className="back-link" href="/students">← Students</Link><p className="eyebrow">Student identification</p><h1>Student ID card</h1></div><PrintButton /></header>
      <section className="id-card" aria-label="Printable student ID card">
        <div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div>
        <p className="eyebrow">Student identification card</p>
        <div className="id-card-body">
          <div className="avatar id-avatar">{student.firstName[0]}{student.lastName[0]}</div>
          <div><h2>{student.firstName} {student.lastName}</h2><p>{student.email}</p><p>{student.phone ?? "No contact number"}</p></div>
        </div>
        <div className="id-card-grid"><span>Admission number<strong>{student.admissionNo}</strong></span><span>Roll number<strong>{student.rollNo ?? "—"}</strong></span><span>Class<strong>{enrollment?.class.name ?? "Not assigned"}</strong></span><span>Grade / section<strong>{student.grade}{student.section ? ` / ${student.section}` : ""}</strong></span></div>
      </section>
    </main>
  );
}