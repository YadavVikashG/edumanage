import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClass } from "./actions";
import { requireRole } from "@/lib/auth-guards";
import { SCHOOL_DIVISIONS, SCHOOL_GRADES } from "@/lib/school-options";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  await requireRole("ADMIN");
  const [classes, teachers] = await prisma.$transaction([
    prisma.schoolClass.findMany({
      include: {
        teacher: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.teacher.findMany({ orderBy: { lastName: "asc" } }),
  ]);

  return (
    <main className="content students-page">
      <header className="topbar">
        <div>
          <Link className="back-link" href="/">← Overview</Link>
          <p className="eyebrow">Academic structure</p>
          <h1>Classes</h1>
        </div>
        <Link className="primary-button" href="#add-class">+ <span>Add class</span></Link>
      </header>

      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Current classes</p>
              <h2>{classes.length} classes</h2>
            </div>
            <span className="status-pill green">Live from database</span>
          </div>

          <div className="student-table">
            <div className="student-row class-row student-head">
              <span>Class</span>
              <span>Teacher</span>
              <span>Students</span>
              <span>Year</span>
            </div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <strong>No classes yet</strong>
                <span>Create a class and assign a teacher.</span>
              </div>
            ) : (
              classes.map((item) => (
                <Link href={`/classes/${item.id}`} key={item.id} className="student-row class-row" style={{ textDecoration: "none", color: "inherit" }}>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.grade}{item.section ? ` - ${item.section}` : ""}</small>
                  </span>
                  <span>{item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "Unassigned"}</span>
                  <span>{item._count.enrollments}</span>
                  <span>${Number(item.feeAmount ?? 0).toFixed(2)} · {item.academicYear}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="panel add-student-panel" id="add-class">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New record</p>
              <h2>Add a class</h2>
            </div>
          </div>

          <form action={createClass} className="student-form">
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

            <label>
              Academic year
              <input name="academicYear" required defaultValue="2026-27" />
            </label>

            <label>
              Class fee
              <input name="feeAmount" type="number" min="0" step="0.01" placeholder="10000" />
              <small className="field-help">Admin can change this fee for the class.</small>
            </label>

            <label>
              Teacher
              <select name="teacherId" defaultValue="">
                <option value="">Unassigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>
                ))}
              </select>
            </label>

            <button className="primary-button form-submit" type="submit">Save class</button>
          </form>
        </div>
      </section>
    </main>
  );
}
