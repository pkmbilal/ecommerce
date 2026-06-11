import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  applyAdminProductBulkAction,
  parseProductBulkActionFormData,
} from "@/lib/admin/catalog";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/products", request.url), {
      status: 303,
    });
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.adminMutation,
    subject: "products-bulk",
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: "/admin/products",
      result: rateLimit,
      statusValue: "Too many product changes. Try again shortly.",
    });
  }

  const formData = await request.formData();
  const returnTo = getSafeProductsReturnPath(formData.get("returnTo"));

  try {
    await applyAdminProductBulkAction(parseProductBulkActionFormData(formData));
  } catch (error) {
    const url = new URL(returnTo, request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to update selected products.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");

  const url = new URL(returnTo, request.url);
  url.searchParams.set("saved", "bulk");

  return NextResponse.redirect(url, {
    status: 303,
  });
}

function getSafeProductsReturnPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/admin/products";
  }

  if (value === "/admin/products" || value.startsWith("/admin/products?")) {
    return value;
  }

  return "/admin/products";
}
