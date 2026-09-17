import Link from "next/link";
import { auth } from "@/auth";
import { resetManagedPassword, resetPassword } from "./actions";

export default async function ForgotPasswordPage() {
  const session = await auth();
  const canManagePasswords = session?.user.role === "ADMIN" || session?.user.role === "TEACHER";
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div>
        <p className="eyebrow">Account recovery</p>
        <h1>Reset password.</h1>
        <p className="auth-copy">Enter your current password, email, and admission or employee number.</p>
        <form action={resetPassword} className="student-form">
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Account type<select name="role" defaultValue="STUDENT"><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></select></label>
          <label>Admission or employee number<input name="identity" required /></label>
          <label>Old password<input name="oldPassword" type="password" required autoComplete="current-password" /></label>
          <label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
          <button className="primary-button form-submit" type="submit">Reset password</button>
        </form>
        {canManagePasswords && <section className="panel" style={{ marginTop: 24 }}><p className="eyebrow">Staff password management</p><h2>Reset another account</h2><p className="auth-copy">Admins can reset teacher and student accounts. Teachers can reset student accounts only.</p><form action={resetManagedPassword} className="student-form"><label>Account type<select name="role" defaultValue="STUDENT">{session?.user.role === "ADMIN" && <option value="TEACHER">Teacher</option>}<option value="STUDENT">Student</option></select></label><label>Admission or employee number<input name="identity" required /></label><label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label><button className="primary-button form-submit" type="submit">Set account password</button></form></section>}
        <Link className="back-link" href="/login">Back to login</Link>
      </section>
    </main>
  );
}