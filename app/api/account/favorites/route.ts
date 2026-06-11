import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/admin/auth";
import {
  removeCustomerFavorite,
  toggleCustomerFavoriteBySlug,
} from "@/lib/customer/account";
import { getSafeInternalPath } from "@/lib/auth/redirects";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = getSafeInternalPath(getText(formData, "returnTo")) ?? "/products";
  const profile = await getCurrentProfile();

  if (!profile) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", returnTo);

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (profile.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.accountMutation,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: returnTo,
      result: rateLimit,
    });
  }

  const intent = getText(formData, "intent");

  if (intent === "remove") {
    const productId = getText(formData, "productId");

    if (productId) {
      await removeCustomerFavorite(profile.userId, productId);
    }
  } else {
    const productSlug = getText(formData, "productSlug");

    if (productSlug) {
      await toggleCustomerFavoriteBySlug(profile.userId, productSlug);
    }
  }

  revalidatePath("/account");
  revalidatePath("/account/favorites");
  revalidatePath("/products");
  revalidatePath(returnTo);

  return NextResponse.redirect(new URL(returnTo, request.url), { status: 303 });
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
