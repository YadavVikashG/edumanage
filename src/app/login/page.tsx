"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirect: false });
    if (result?.error) {
      setError("Email or password is incorrect.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return <main className="auth-shell"><section className="auth-card"><div className="brand"><span className="brand-mark">E</span><span>EduManage</span></div><p className="eyebrow">Secure workspace</p><h1>Welcome back.</h1><p className="auth-copy">Sign in to manage your school operations.</p><form className="student-form" onSubmit={handleSubmit}><label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@school.edu" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Your password" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button form-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button></form><Link className="back-link" href="/forgot-password">Forgot password?</Link></section></main>;
}