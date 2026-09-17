import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guards";
import { SCHOOL_GRADES } from "@/lib/school-options";
import { STANDARD_SUBJECTS } from "@/lib/subjects";
import { createSubject } from "./actions";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const session = await requireRole("ADMIN", "TEACHER");
  const teacher = session.user.role === "TEACHER" ? await prisma.teacher.findUnique({ where: { email: session.user.email ?? "" } }) : null;
  const classFilter = teacher ? { teacherId: teacher.id } : {};
  const [classes, customSubjects] = await prisma.$transaction([
    prisma.schoolClass.findMany({ where: classFilter, orderBy: [{ grade: "asc" }, { section: "asc" }] }),
    prisma.subject.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <main className="content students-page">
      <header className="topbar"><div><Link className="back-link" href="/">← Overview</Link><p className="eyebrow">Academic catalogue</p><h1>Subjects</h1></div><Link className="primary-button" href="#add-subject">+ <span>Add subject</span></Link></header>
      <section className="directory-layout">
        <div className="panel student-list-panel">
          <div className="panel-heading"><div><p className="eyebrow">Primary subject list</p><h2>Standard subjects</h2></div><span className="status-pill green">Class 1–12</span></div>
          <div className="student-table"><div className="student-row student-head"><span>Subject</span><span>Available grades</span></div>{STANDARD_SUBJECTS.map((subject) => <div className="student-row" key={subject}><span><b>{subject}</b></span><span>Class 1 to Class 12</span></div>)}{customSubjects.length > 0 && <><div className="panel-heading" style={{ marginTop: 20 }}><div><p className="eyebrow">Added by staff</p><h2>Custom subjects</h2></div></div>{customSubjects.map((subject) => <div className="student-row" key={subject.id}><span><b>{subject.name}</b></span><span>{subject.grade}</span></div>)}</>}</div>
        </div>
        <div className="panel add-student-panel" id="add-subject">
          <div className="panel-heading"><div><p className="eyebrow">Admin or teacher</p><h2>Assign subject to class</h2></div></div>
          <form action={createSubject} className="student-form">
            <label>Subject name<input name="name" list="standard-subjects" required placeholder="Mathematics or a new subject" /></label>
            <datalist id="standard-subjects">{STANDARD_SUBJECTS.map((subject) => <option key={subject} value={subject} />)}</datalist>
            <label>Grade<select name="grade" required defaultValue=""><option value="" disabled>Select class</option>{SCHOOL_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label>
            <label>Class<select name="classId" required defaultValue=""><option value="" disabled>Select class division</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <button className="primary-button form-submit" type="submit">Save subject assignment</button>
          </form>
        </div>
      </section>
    </main>
  );
}