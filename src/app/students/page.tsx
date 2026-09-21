import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { createStudent } from "./actions";
import { resetManagedPassword } from "../forgot-password/actions";
import { SCHOOL_DIVISIONS, SCHOOL_GRADES } from "@/lib/school-options";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ admissionNo?: string }> }) {
  await requireRole("ADMIN", "TEACHER");
  const { admissionNo = "" } = await searchParams;

  // Fetch initial students list from the database
  const students = await prisma.student.findMany({
    where: admissionNo.trim() ? { admissionNo: { contains: admissionNo.trim(), mode: "insensitive" } } : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 100,
  });

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/">← Overview</Link>
          <p className="eyebrow">Student directory</p>
          <h1>Students</h1>
        </div>
        <Link className="primary-button" href="#add-student">
          + <span>Add student</span>
        </Link>
      </header>

      <form method="get" className="panel student-form" style={{ marginBottom: 14 }}>
          <label>Search by admission number<input name="admissionNo" defaultValue={admissionNo} placeholder="ADM-2026-0001" /></label>
        <button className="primary-button form-submit" type="submit">Search student</button>
      </form>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Active records</p>
              <h2>{students.length} students</h2>
            </div>
            <span className="status-pill green">Live from Neon</span>
          </div>

          <div className="student-table">
            <div className="student-row student-head">
              <span>Student</span>
              <span>Admission no.</span>
              <span>Grade</span>
              <span>Status</span>
            </div>

            {students.length === 0 ? (
              <div className="empty-state">
                <strong>No students yet</strong>
                <span>Add the first student record using the form.</span>
              </div>
            ) : (
              students.map((student) => (
                <div className="student-row" key={student.id}>
                  <span className="student-name">
                    <i className="avatar small">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </i>
                    <b>
                      {student.firstName} {student.lastName}
                    </b>
                    <small>{student.email}</small>
                  </span>
                  <span><Link href={`/students/${student.id}/id-card`}>{student.admissionNo}</Link><small>Roll no. {student.rollNo ?? "—"}</small></span>
                  <span>
                    {student.grade}
                    {student.section ? ` - ${student.section}` : ""}
                  </span>
                  <span className="status-pill green">{student.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel add-student-panel" id="add-student">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New record</p>
              <h2>Add a student</h2>
            </div>
          </div>

          <form action={createStudent} className="student-form">
            <p className="field-help">Admission number is generated automatically when the student is saved.</p>

            <div className="form-grid">
              <label>
                First name
                <input name="firstName" required placeholder="Jordan" />
              </label>
              <label>
                Last name
                <input name="lastName" required placeholder="Lee" />
              </label>
            </div>

            <label>
              Email
              <input name="email" type="email" required placeholder="jordan@example.com" />
            </label>

            <label>
              Contact number
              <input name="phone" type="tel" placeholder="+1 555 0100" />
            </label>

            <label>
              Student login password
              <input name="password" type="password" minLength={8} required placeholder="At least 8 characters" />
            </label>

            <div className="form-grid">
              <label>
                Grade
                <select name="grade" required defaultValue="">
                  <option value="" disabled>Select class</option>
                  {SCHOOL_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
              </label>
              <label>
                Division
                <select name="section" required defaultValue="">
                  <option value="" disabled>Select division</option>
                  {SCHOOL_DIVISIONS.map((division) => <option key={division} value={division}>Division {division}</option>)}
                </select>
              </label>
            </div>

            <p className="field-help">The next roll number is assigned automatically. If this class has a fee, the student is enrolled and the first tuition invoice is created automatically.</p>

            <button className="primary-button form-submit" type="submit">
              Save student
            </button>
          </form>

          <div className="password-management">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Account access</p>
                <h2>Change a student password</h2>
              </div>
            </div>
            <p className="field-help">Use the student&apos;s admission number to set a new login password without knowing the old one.</p>
            <form action={resetManagedPassword} className="student-form">
              <input type="hidden" name="role" value="STUDENT" />
              <label>
                Admission number
                <input name="identity" required placeholder="ADM-2026-0001" />
              </label>
              <label>
                New password
                <input name="password" type="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" />
              </label>
              <button className="primary-button form-submit" type="submit">
                Set student password
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
