import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { updateClassFee } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const session = await requireRole("ADMIN", "TEACHER");
  const { classId } = await params;

  const teacher = session.user.role === "TEACHER" ? await prisma.teacher.findUnique({ where: { email: session.user.email ?? "" } }) : null;
  const schoolClass = await prisma.schoolClass.findFirst({
    where: { id: classId, ...(teacher ? { teacherId: teacher.id } : {}) },
    include: {
      teacher: true,
      enrollments: { include: { student: true } },
      attendance: { include: { student: true }, orderBy: { date: "desc" }, take: 10 },
      exams: { orderBy: { date: "asc" }, take: 10 },
    },
  });

  if (!schoolClass) {
    return (
      <main className="content students-page">
        <header className="topbar">
          <div>
            <Link className="back-link" href="/classes">← Back to classes</Link>
            <p className="eyebrow">Academic detail</p>
            <h1>Class not found</h1>
          </div>
        </header>
      </main>
    );
  }

  const students = schoolClass.enrollments.map((enrollment) => enrollment.student);

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/classes">← Back to classes</Link>
          <p className="eyebrow">Class overview</p>
          <h1>{schoolClass.name}</h1>
        </div>
      </header>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Class profile</p>
              <h2>{schoolClass.grade} {schoolClass.section ? `- ${schoolClass.section}` : ""}</h2>
            </div>
            <span className="status-pill green">{schoolClass.academicYear}</span>
          </div>

          <div className="student-table">
            <div className="student-row student-head">
              <span>Teacher</span>
              <span>Students</span>
              <span>Exams</span>
              <span>Attendance records</span>
            </div>
            <div className="student-row">
              <span>{schoolClass.teacher ? `${schoolClass.teacher.firstName} ${schoolClass.teacher.lastName}` : "Unassigned"}</span>
              <span>{students.length}</span>
              <span>{schoolClass.exams.length}</span>
              <span>{schoolClass.attendance.length}</span>
            </div>
            <div className="student-row"><span>Class fee</span><span>${Number(schoolClass.feeAmount ?? 0).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Class roster</p>
              <h2>Students in this class</h2>
            </div>
          </div>

          <div className="student-table">
            {students.length === 0 ? (
              <div className="empty-state">
                <strong>No students enrolled</strong>
                <span>Use enrollment records to assign students to this class.</span>
              </div>
            ) : (
              students.map((student) => (
                <div className="student-row" key={student.id}>
                  <span className="student-name">
                    <i className="avatar small">{student.firstName[0]}{student.lastName[0]}</i>
                    <b>{student.firstName} {student.lastName}</b>
                    <small>{student.email}</small>
                  </span>
                  <span>{student.admissionNo}</span>
                  <span>{student.grade}</span>
                  <span className="status-pill green">{student.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {session.user.role === "ADMIN" && <section className="panel add-student-panel" style={{ marginTop: 18 }}><div className="panel-heading"><div><p className="eyebrow">Finance settings</p><h2>Modify class fee</h2></div></div><p className="field-help">Saving this amount applies the fee to matching students, creates missing invoices, and preserves payments already recorded.</p><form action={updateClassFee} className="student-form"><input type="hidden" name="classId" value={schoolClass.id} /><label>Fee amount<input name="feeAmount" type="number" min="0" step="0.01" required defaultValue={Number(schoolClass.feeAmount ?? 0)} /></label><button className="primary-button form-submit" type="submit">Apply fee to class students</button></form></section>}

      <section className="directory-layout" style={{ marginTop: 18 }}>
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Exam schedule</p>
              <h2>Upcoming assessments</h2>
            </div>
          </div>
          <div className="student-table">
            {schoolClass.exams.length === 0 ? (
              <div className="empty-state"><strong>No exams for this class</strong><span>Schedule an assessment to populate the list.</span></div>
            ) : schoolClass.exams.map((exam) => (
              <div className="student-row" key={exam.id}>
                <span><b>{exam.name}</b><small>{exam.subject}</small></span>
                <span>{new Date(exam.date).toLocaleDateString()}</span>
                <span>{exam.room ?? "Unassigned"}</span>
                <span className="status-pill blue">{exam.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel add-student-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>Latest records</h2>
            </div>
          </div>
          <div className="student-table">
            {schoolClass.attendance.length === 0 ? (
              <div className="empty-state"><strong>No attendance yet</strong><span>Mark the register for this class.</span></div>
            ) : schoolClass.attendance.map((record) => (
              <div className="student-row" key={record.id}>
                <span><b>{record.student.firstName} {record.student.lastName}</b><small>{record.student.admissionNo}</small></span>
                <span>{new Date(record.date).toLocaleDateString()}</span>
                <span>{record.note ?? "—"}</span>
                <span className={`status-pill ${record.status === "PRESENT" ? "green" : "orange"}`}>{record.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <Link className="primary-button" href="/classes">Back to classes</Link>
      </div>
    </main>
  );
}
