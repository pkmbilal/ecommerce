import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "saha_admin_session";

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

export async function hasAdminSession() {
  const token = process.env.ADMIN_ACCESS_TOKEN;

  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value === token;
}

export function isValidAdminToken(value: string) {
  const token = process.env.ADMIN_ACCESS_TOKEN;

  return Boolean(token) && value === token;
}
