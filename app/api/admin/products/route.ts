import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  createAdminProduct,
  parseProductFormData,
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
    subject: "products",
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: "/admin/products/new",
      result: rateLimit,
      statusValue: "Too many product changes. Try again shortly.",
    });
  }

  const formData = await request.formData();

  try {
    await createAdminProduct(
      await parseProductFormData(formData, "create"),
    );
  } catch (error) {
    const url = new URL("/admin/products/new", request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to create product.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");

  return NextResponse.redirect(new URL("/admin/products?saved=created", request.url), {
    status: 303,
  });
}
