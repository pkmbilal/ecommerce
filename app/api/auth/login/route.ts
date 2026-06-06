import { NextResponse } from "next/server";

import { getProfileForUser } from "@/lib/admin/auth";
import {
  getSafeInternalPath,
  getSafeRoleRedirectPath,
} from "@/lib/auth/redirects";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const next = getSafeInternalPath(getText(formData, "next"));

  if (!getSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/login?error=setup", request.url), {
      status: 303,
    });
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), {
      status: 303,
    });
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), {
      status: 303,
    });
  }

  const profile = await getProfileForUser(data.user.id, data.user.email ?? email);
  const redirectPath = getSafeRoleRedirectPath(profile.role, next);

  return NextResponse.redirect(new URL(redirectPath, request.url), {
    status: 303,
  });
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
