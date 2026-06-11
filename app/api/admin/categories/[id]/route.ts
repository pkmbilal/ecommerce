import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  parseCategoryFormData,
  updateAdminCategory,
} from "@/lib/admin/catalog";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/categories/[id]">,
) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/categories", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.adminMutation,
    subject: `category:${id}`,
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: "/admin/categories",
      result: rateLimit,
      statusValue: "Too many category changes. Try again shortly.",
    });
  }

  const formData = await request.formData();

  try {
    await updateAdminCategory(id, parseCategoryFormData(formData));
  } catch (error) {
    const url = new URL("/admin/categories", request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to update category.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return NextResponse.redirect(new URL("/admin/categories?saved=1", request.url), {
    status: 303,
  });
}
