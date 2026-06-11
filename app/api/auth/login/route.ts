import { NextResponse } from "next/server";

import { getProfileForAuthenticatedUser } from "@/lib/admin/auth";
import {
  getSafeInternalPath,
  getSafeRoleRedirectPath,
} from "@/lib/auth/redirects";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const next = getSafeInternalPath(getText(formData, "next"));
  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.login,
    subject: email || "missing-email",
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: "/login",
      result: rateLimit,
    });
  }

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

  const profile = await getProfileForAuthenticatedUser(
    data.user.id,
    data.user.email ?? email,
  );
  const redirectPath = getSafeRoleRedirectPath(profile.role, next);

  return NextResponse.redirect(new URL(redirectPath, request.url), {
    status: 303,
  });
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
