import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireRole("ADMIN");

  const [studentCount, teacherCount, classCount, examCount, attendanceCount, feeTotal] = await prisma.$transaction([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.schoolClass.count(),
    prisma.exam.count(),
    prisma.attendanceRecord.count(),
    prisma.feeInvoice.aggregate({ _sum: { amount: true } }),
  ]);

  const classes = await prisma.schoolClass.findMany({
    include: { teacher: true, _count: { select: { enrollments: true } } },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    take: 10,
  });

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/">← Overview</Link>
          <p className="eyebrow">School analytics</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="metric-grid" aria-label="School metrics">
        <article className="metric-card accent-ink"><span className="metric-label">Students</span><strong>{studentCount}</strong><span className="trend positive">Live count</span></article>
        <article className="metric-card accent-lime"><span className="metric-label">Teachers</span><strong>{teacherCount}</strong><span className="trend positive">Available</span></article>
        <article className="metric-card accent-coral"><span className="metric-label">Classes</span><strong>{classCount}</strong><span className="trend positive">Active sections</span></article>
        <article className="metric-card accent-blue"><span className="metric-label">Exams</span><strong>{examCount}</strong><span className="trend warning">Scheduled</span></article>
      </section>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Academic view</p>
              <h2>Class overview</h2>
            </div>
          </div>
          <div className="student-table">
            <div className="student-row student-head">
              <span>Class</span>
              <span>Teacher</span>
              <span>Students</span>
              <span>Year</span>
            </div>
            {classes.map((item) => (
              <Link href={`/classes/${item.id}`} key={item.id} className="student-row" style={{ textDecoration: "none", color: "inherit" }}>
                <span><b>{item.name}</b><small>{item.grade}{item.section ? ` - ${item.section}` : ""}</small></span>
                <span>{item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "Unassigned"}</span>
                <span>{item._count.enrollments}</span>
                <span>{item.academicYear}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Operations</p>
              <h2>Latest totals</h2>
            </div>
          </div>
          <div className="student-table">
            <div className="student-row">
              <span>Attendance records</span>
              <span>{attendanceCount}</span>
            </div>
            <div className="student-row">
              <span>Fee totals</span>
              <span>${Number(feeTotal._sum.amount ?? 0).toLocaleString()}</span>
            </div>
            <div className="student-row">
              <span>Student roster</span>
              <Link href="/students">Open list</Link>
            </div>
            <div className="student-row">
              <span>Exam schedule</span>
              <Link href="/exams">Open list</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
