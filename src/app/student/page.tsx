import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SignOutButton } from "@/app/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT");
  const userEmail = session.user.email ?? "";

  const student = await prisma.student.findFirst({
    where: { email: userEmail },
  });

  if (!student) {
    return (
      <main className="content students-page">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/">← Home</Link>
            <p className="eyebrow">Student access</p>
            <h1>No student profile found</h1>
          </div>
        </header>
        <div className="panel empty-state">
          <strong>Your account is not linked to a student record.</strong>
          <span>Ask the admin to connect your profile to a student profile.</span>
        </div>
      </main>
    );
  }

  const [enrollments, attendance, examResults] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: { class: { include: { teacher: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { class: true },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.examResult.findMany({
      where: { studentId: student.id },
      include: { exam: { include: { class: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const invoices = await prisma.feeInvoice.findMany({ where: { studentId: student.id }, include: { payments: true }, orderBy: { dueDate: "asc" } });
  const feesBilled = invoices.reduce((total, invoice) => total + Number(invoice.amount), 0);
  const feesPaid = invoices.reduce((total, invoice) => total + invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0), 0);

  const classes = enrollments.map((item) => item.class);

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/">← Home</Link>
          <p className="eyebrow">Student dashboard</p>
          <h1>{student.firstName} {student.lastName}</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{student.admissionNo}</h2>
            </div>
            <span className="status-pill green">{student.status}</span>
          </div>
          <div className="student-table">
            <div className="student-row student-head">
              <span>Field</span>
              <span>Value</span>
            </div>
            <div className="student-row"><span>Email</span><span>{student.email}</span></div>
            <div className="student-row"><span>Grade</span><span>{student.grade}</span></div>
            <div className="student-row"><span>Section</span><span>{student.section ?? "—"}</span></div>
            <div className="student-row"><span>Classes</span><span>{classes.length}</span></div>
            <div className="student-row"><span>Fees billed</span><span>${feesBilled.toFixed(2)}</span></div>
            <div className="student-row"><span>Fees paid</span><span>${feesPaid.toFixed(2)}</span></div>
            <div className="student-row"><span>Fees remaining</span><span>${Math.max(feesBilled - feesPaid, 0).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">My classes</p>
              <h2>Enrolled classes</h2>
            </div>
          </div>
          <div className="student-table">
            {classes.length === 0 ? (
              <div className="empty-state"><strong>No class assignment</strong><span>Your class list is empty right now.</span></div>
            ) : classes.map((item) => (
              <div className="student-row" key={item.id}>
                <span><b>{item.name}</b><small>{item.grade}{item.section ? ` - ${item.section}` : ""}</small></span>
                <span>{item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "Unassigned"}</span>
                <span className="status-pill blue">{item.academicYear}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="directory-layout" style={{ marginTop: 18 }}>
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>Recent attendances</h2>
            </div>
          </div>
          <div className="student-table">
            {attendance.length === 0 ? (
              <div className="empty-state"><strong>No attendance yet</strong><span>Your attendance records will appear here.</span></div>
            ) : attendance.map((record) => (
              <div className="student-row" key={record.id}>
                <span>{record.class.name}</span>
                <span>{new Date(record.date).toLocaleDateString()}</span>
                <span className={`status-pill ${record.status === "PRESENT" ? "green" : "orange"}`}>{record.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assessments</p>
              <h2>Exam results</h2>
            </div>
          </div>
          <div className="student-table">
            {examResults.length === 0 ? (
              <div className="empty-state"><strong>No results yet</strong><span>Your marks will appear here as exams are published.</span></div>
            ) : examResults.map((result) => (
              <div className="student-row" key={result.id}>
                <span><b>{result.exam.name}</b><small>{result.exam.subject}</small></span>
                <span>{result.exam.class.name}</span>
                <span><b>{result.marks.toString()}</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
