import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, isValidAdminToken } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token");

  if (typeof token !== "string" || !isValidAdminToken(token.trim())) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), {
      status: 303,
    });
  }

  const response = NextResponse.redirect(new URL("/admin/orders", request.url), {
    status: 303,
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, token.trim(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
