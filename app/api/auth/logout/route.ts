import { NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!getSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
