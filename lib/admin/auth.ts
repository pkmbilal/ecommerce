import "server-only";

import { redirect } from "next/navigation";

import {
  getRoleRedirectPath,
  type AppRole,
} from "@/lib/auth/redirects";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export { getRoleRedirectPath };

export type AuthenticatedProfile = {
  userId: string;
  email: string;
  fullName?: string;
  role: AppRole;
};

export async function requireAdminSession() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/admin/orders");
  }

  if (profile.role !== "admin") {
    redirect("/account?error=admin");
  }

  return profile;
}

export async function requireCustomerSession() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?next=/account");
  }

  return profile;
}

export async function hasAdminSession() {
  const profile = await getCurrentProfile();

  return profile?.role === "admin";
}

export async function getCurrentProfile(): Promise<AuthenticatedProfile | null> {
  if (!getSupabasePublicEnv()) {
    return null;
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return getProfileForAuthenticatedUser(data.user.id, data.user.email ?? "");
}

export async function getProfileForAuthenticatedUser(
  userId: string,
  fallbackEmail: string,
): Promise<AuthenticatedProfile> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user profile: ${error.message}`);
  }

  return {
    userId: data?.id ?? userId,
    email: data?.email || fallbackEmail,
    fullName: data?.full_name ?? undefined,
    role: data?.role ?? "customer",
  };
}
