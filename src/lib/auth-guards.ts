import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect("/unauthorized");
  return session;
}