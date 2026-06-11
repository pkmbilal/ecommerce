import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireCustomerDashboardSession } from "@/lib/admin/auth";
import { createCustomerAddress } from "@/lib/customer/account";
import { validateAddressForm } from "@/lib/customer/validation";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const profile = await requireCustomerDashboardSession();
  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.accountMutation,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: "/account/addresses",
      result: rateLimit,
      statusParam: "status",
    });
  }

  const formData = await request.formData();
  const validation = validateAddressForm(formData);

  if (!validation.success) {
    return redirectWithStatus(request, "address_error");
  }

  await createCustomerAddress(profile.userId, validation.data);
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return redirectWithStatus(request, "address_saved");
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL("/account/addresses", request.url);
  url.searchParams.set("status", status);

  return NextResponse.redirect(url, { status: 303 });
}
