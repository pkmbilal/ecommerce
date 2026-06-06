import { NextResponse } from "next/server";

import { getSafeInternalPath } from "@/lib/auth/redirects";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const fullName = getText(formData, "fullName");
  const next = getSafeInternalPath(getText(formData, "next"));

  if (!getSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/login?error=setup", request.url), {
      status: 303,
    });
  }

  if (!email || password.length < 6 || fullName.length < 2) {
    return NextResponse.redirect(new URL("/login?error=signup", request.url), {
      status: 303,
    });
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=signup", request.url), {
      status: 303,
    });
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("registered", "1");

  if (next) {
    url.searchParams.set("next", next);
  }

  return NextResponse.redirect(url, { status: 303 });
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
