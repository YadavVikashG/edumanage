import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { SignOutButton } from "@/app/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await requireSession();
  if (session.user.role === "STUDENT") redirect("/student");
  if (session.user.role === "TEACHER") redirect("/teacher");

  const [studentCount, classCount, attendanceRecords, feeTotal, upcomingExams] = await prisma.$transaction([
    prisma.student.count(),
    prisma.schoolClass.count(),
    prisma.attendanceRecord.findMany({
      orderBy: { date: "desc" },
      take: 30,
      include: { student: true },
    }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true } }),
    prisma.exam.findMany({
      orderBy: { date: "asc" },
      take: 3,
      include: { class: true },
    }),
  ]);

  const attendanceRate = attendanceRecords.length
    ? Math.round((attendanceRecords.filter((record) => record.status === "PRESENT").length / attendanceRecords.length) * 100)
    : 0;

  const pendingActions = attendanceRecords.filter((record) => record.status !== "PRESENT").length + upcomingExams.length;
  const collectedFees = Number(feeTotal._sum.amount ?? 0);
  const dashboardHref = session.user.role === "ADMIN" ? "/dashboard" : "/";
  const canManageStudents = session.user.role === "ADMIN";
  const canManageAcademics = session.user.role === "ADMIN";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div>
        <p className="eyebrow">Workspace</p>
        <nav className="nav-list" aria-label="Main navigation">
          <Link className="nav-item active" href={dashboardHref}><span>+</span>Overview</Link>
          {canManageStudents && <Link className="nav-item" href="/students"><span>+</span>Students</Link>}
          {session.user.role === "ADMIN" && <Link className="nav-item" href="/teachers"><span>+</span>Teachers</Link>}
          {session.user.role === "ADMIN" && <Link className="nav-item" href="/classes"><span>+</span>Classes</Link>}
          {canManageAcademics && <Link className="nav-item" href="/subjects"><span>+</span>Subjects</Link>}
          {canManageAcademics && <Link className="nav-item" href="/attendance"><span>+</span>Attendance</Link>}
          {canManageAcademics && <Link className="nav-item" href="/exams"><span>+</span>Examinations</Link>}
          {(session.user.role === "ADMIN" || session.user.role === "ACCOUNTANT") && <Link className="nav-item" href="/fees"><span>+</span>Fees & payments</Link>}
        </nav>
        <div className="sidebar-bottom">
          <Link className="nav-item" href={dashboardHref}><span>+</span>My dashboard</Link>
          <div className="profile"><div className="avatar">{session.user.name?.slice(0, 2).toUpperCase()}</div><div><strong>{session.user.name}</strong><small>{session.user.role}</small></div><SignOutButton /></div>
        </div>
      </aside>

      <main className="content" id="overview">
        <header className="topbar"><div><p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p><h1>Good morning, {session.user.name?.split(" ")[0] ?? "there"}.</h1></div><div className="top-actions"><button className="icon-button" aria-label="Search">/</button><button className="icon-button" aria-label="Notifications">!</button>{canManageStudents && <Link className="primary-button" href="/students">+ <span>Add record</span></Link>}</div></header>

        <section className="metric-grid" aria-label="School overview">
          <article className="metric-card accent-ink"><span className="metric-label">Total students</span><strong>{studentCount.toLocaleString()}</strong><span className="trend positive">Live count <em>from database</em></span></article>
          <article className="metric-card accent-lime"><span className="metric-label">Avg. attendance</span><strong>{attendanceRate}%</strong><span className="trend positive">{attendanceRecords.length} recorded <em>sessions</em></span></article>
          <article className="metric-card accent-coral"><span className="metric-label">Fees collected</span><strong>${collectedFees.toLocaleString()}</strong><span className="trend positive">Across <em>{classCount} classes</em></span></article>
          <article className="metric-card accent-blue"><span className="metric-label">Pending actions</span><strong>{pendingActions}</strong><span className="trend warning">Needs attention</span></article>
        </section>

        <section className="dashboard-grid">
          <article className="panel attendance-panel" id="attendance">
            <div className="panel-heading"><div><p className="eyebrow">Attendance pulse</p><h2>Recent attendance</h2></div><Link className="text-button" href="/attendance">View all <span>→</span></Link></div>
            <div className="chart">
              <div className="chart-y"><span>100%</span><span>80%</span><span>60%</span><span>40%</span></div>
              <div className="chart-bars">
                {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => {
                  const count = attendanceRecords.filter((record) => record.status === status).length;
                  const height = attendanceRecords.length ? Math.max((count / Math.max(attendanceRecords.length, 1)) * 100, 8) : 0;
                  return (
                    <div className="bar-column" key={status}>
                      <div className="bar" style={{ height: `${height}%` }}></div>
                      <small>{status.slice(0, 3)}</small>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="chart-footer"><span><b className="legend-dot"></b>Present</span><span><b className="legend-dot absent"></b>Other</span><strong>{attendanceRate}% average</strong></div>
          </article>

          <article className="panel exam-panel" id="exams">
            <div className="panel-heading"><div><p className="eyebrow">Academic calendar</p><h2>Upcoming exams</h2></div><Link className="more-button" href="/exams" aria-label="More exam options">…</Link></div>
            <div className="exam-list">
              {upcomingExams.length === 0 ? (
                <div className="empty-state"><strong>No exams scheduled</strong><span>The exam calendar is clear.</span></div>
              ) : upcomingExams.map((exam) => (
                <div className="exam-item" key={exam.id}>
                  <div className="date-tile"><strong>{new Date(exam.date).getDate()}</strong><small>{new Date(exam.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</small></div>
                  <div><strong>{exam.name}</strong><small>{exam.class.name} · {exam.subject}</small></div>
                  <span className="status-pill blue">{exam.status}</span>
                </div>
              ))}
            </div>
            <Link className="panel-link" href="/exams">View full calendar <span>→</span></Link>
          </article>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">Latest updates</p><h2>Recent activity</h2></div><Link className="text-button" href="/attendance">View all <span>→</span></Link></div>
          <div className="activity-table">
            <div className="table-row table-head"><span>Activity</span><span>Owner</span><span>Time</span><span>Status</span></div>
            {attendanceRecords.slice(0, 3).map((record) => (
              <div className="table-row" key={record.id}>
                <span className="activity-name"><i className="activity-icon green">+</i><b>{record.student.firstName} {record.student.lastName}</b><small>{record.classId ? "Attendance recorded" : "Update"}</small></span>
                <span>{record.student.firstName}</span>
                <span>{new Date(record.date).toLocaleDateString()}</span>
                <span className={`status-pill ${record.status === "PRESENT" ? "green" : "orange"}`}>{record.status}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">EduManage <span>·</span> Academic year 2026–27 <span>·</span> Live database data</footer>
      </main>
    </div>
  );
}
