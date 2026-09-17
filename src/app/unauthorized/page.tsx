import Link from "next/link";
import { auth } from "@/auth";

export default async function UnauthorizedPage() {
  const session = await auth();
  const dashboardHref = session?.user.role === "STUDENT" ? "/student" : session?.user.role === "TEACHER" ? "/teacher" : "/dashboard";
  const dashboardLabel = session?.user.role === "STUDENT" ? "Open student dashboard" : session?.user.role === "TEACHER" ? "Open teacher dashboard" : "Return to dashboard";
  return <main className="auth-shell"><section className="auth-card"><div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div><p className="eyebrow">Access denied</p><h1>Choose your dashboard.</h1><p className="auth-copy">This page is unavailable for your account. Use your role dashboard to continue.</p><Link className="primary-button form-submit" href={dashboardHref}>{dashboardLabel}</Link>{!session && <Link className="back-link" href="/login">Sign in</Link>}</section></main>;
}