import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireCustomerSession } from "@/lib/admin/auth";
import { updateCustomerProfile } from "@/lib/customer/account";
import { validateProfileForm } from "@/lib/customer/validation";

export async function POST(request: Request) {
  const profile = await requireCustomerSession();
  const formData = await request.formData();
  const validation = validateProfileForm(formData);

  if (!validation.success) {
    return redirectWithStatus(request, "profile_error");
  }

  await updateCustomerProfile(profile.userId, validation.data);
  revalidatePath("/account");
  revalidatePath("/account/profile");

  return redirectWithStatus(request, "profile_saved");
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL("/account/profile", request.url);
  url.searchParams.set("status", status);

  return NextResponse.redirect(url, { status: 303 });
}
