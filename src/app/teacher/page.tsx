import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SignOutButton } from "@/app/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await requireRole("TEACHER");
  const userEmail = session.user.email ?? "";

  const teacher = await prisma.teacher.findFirst({
    where: { email: userEmail },
  });

  if (!teacher) {
    return (
      <main className="content students-page">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/">← Home</Link>
            <p className="eyebrow">Teacher access</p>
            <h1>No teacher profile found</h1>
          </div>
        </header>
        <div className="panel empty-state">
          <strong>Your account is not linked to a teacher record.</strong>
          <span>Ask the admin to link your account to a teacher profile.</span>
        </div>
      </main>
    );
  }

  const classes = await prisma.schoolClass.findMany({
    where: { teacherId: teacher.id },
    include: {
      _count: { select: { enrollments: true } },
      teacher: true,
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  const classIds = classes.map((item) => item.id);
  const classStudents = await prisma.enrollment.findMany({
    where: { classId: { in: classIds } },
    include: { student: true, class: true },
    orderBy: [{ classId: "asc" }, { student: { lastName: "asc" } }],
  });
  const teacherExams = await prisma.exam.findMany({
    where: { classId: { in: classIds } },
    include: { class: true },
    orderBy: { date: "asc" },
    take: 10,
  });

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/">← Home</Link>
          <p className="eyebrow">Teacher dashboard</p>
          <h1>{teacher.firstName} {teacher.lastName}</h1>
        </div>
        <SignOutButton />
      </header>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>{teacher.employeeNo}</h2>
            </div>
            <span className="status-pill green">{teacher.status}</span>
          </div>
          <div className="student-table">
            <div className="student-row student-head">
              <span>Field</span>
              <span>Value</span>
            </div>
            <div className="student-row"><span>Email</span><span>{teacher.email}</span></div>
            <div className="student-row"><span>Subject</span><span>{teacher.subject}</span></div>
            <div className="student-row"><span>Classes</span><span>{classes.length}</span></div>
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assigned classes</p>
              <h2>My teaching load</h2>
            </div>
          </div>
          <div className="student-table">
            {classes.length === 0 ? (
              <div className="empty-state"><strong>No classes assigned</strong><span>Assign a class to start teaching.</span></div>
            ) : classes.map((item) => (
              <div className="student-row" key={item.id}>
                <span><b>{item.name}</b><small>{item.grade}{item.section ? ` - ${item.section}` : ""}</small></span>
                <span>{item._count.enrollments} students</span>
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
              <p className="eyebrow">Roster</p>
              <h2>Students in teacher classes</h2>
            </div>
          </div>
          <div className="student-table">
            {classStudents.length === 0 ? (
              <div className="empty-state"><strong>No students assigned</strong><span>Class enrollments will appear here.</span></div>
            ) : classStudents.map((item) => (
              <div className="student-row" key={`${item.classId}-${item.studentId}`}>
                <span><b>{item.student.firstName} {item.student.lastName}</b><small>{item.student.admissionNo}</small></span>
                <span>{item.class.name}</span>
                <span>{item.class.grade}{item.class.section ? ` - ${item.class.section}` : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assessment</p>
              <h2>Upcoming exams</h2>
            </div>
          </div>
          <div className="student-table">
            {teacherExams.length === 0 ? (
              <div className="empty-state"><strong>No exams scheduled</strong><span>Upcoming exams will appear here.</span></div>
            ) : teacherExams.map((exam) => (
              <div className="student-row" key={exam.id}>
                <span><b>{exam.name}</b><small>{exam.subject}</small></span>
                <span>{exam.class.name}</span>
                <span>{new Date(exam.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
