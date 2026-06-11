import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireCustomerDashboardSession } from "@/lib/admin/auth";
import {
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/lib/customer/account";
import { validateAddressForm } from "@/lib/customer/validation";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/account/addresses/[id]">,
) {
  const profile = await requireCustomerDashboardSession();
  const { id } = await context.params;
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
  const intent = getText(formData, "intent");

  if (intent === "delete") {
    await deleteCustomerAddress(profile.userId, id);
    revalidateAccountPaths();
    return redirectWithStatus(request, "address_deleted");
  }

  if (intent === "default") {
    await setDefaultCustomerAddress(profile.userId, id);
    revalidateAccountPaths();
    return redirectWithStatus(request, "address_default");
  }

  const validation = validateAddressForm(formData);

  if (!validation.success) {
    return redirectWithStatus(request, "address_error");
  }

  await updateCustomerAddress(profile.userId, id, validation.data);
  revalidateAccountPaths();

  return redirectWithStatus(request, "address_saved");
}

function revalidateAccountPaths() {
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

function redirectWithStatus(request: Request, status: string) {
  const url = new URL("/account/addresses", request.url);
  url.searchParams.set("status", status);

  return NextResponse.redirect(url, { status: 303 });
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
