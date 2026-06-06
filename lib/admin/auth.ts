import "server-only";

import { redirect } from "next/navigation";

import {
  getRoleRedirectPath,
  type AppRole,
} from "@/lib/auth/redirects";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  createSupabaseAuthServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

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

  return getProfileForUser(data.user.id, data.user.email ?? "");
}

export async function getProfileForUser(
  userId: string,
  fallbackEmail: string,
): Promise<AuthenticatedProfile> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user profile: ${error.message}`);
  }

  if (data) {
    return {
      userId: data.id,
      email: data.email || fallbackEmail,
      fullName: data.full_name ?? undefined,
      role: data.role,
    };
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: fallbackEmail,
      role: "customer",
    })
    .select("id, email, full_name, role")
    .single();

  if (insertError) {
    throw new Error(`Failed to create user profile: ${insertError.message}`);
  }

  return {
    userId: created.id,
    email: created.email,
    fullName: created.full_name ?? undefined,
    role: created.role,
  };
}
