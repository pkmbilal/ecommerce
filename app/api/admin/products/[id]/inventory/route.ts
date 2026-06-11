import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  adjustAdminProductInventory,
  parseInventoryAdjustmentFormData,
} from "@/lib/admin/catalog";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]/inventory">,
) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/products", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.adminMutation,
    subject: `inventory:${id}`,
  });

  if (!rateLimit.allowed) {
    return rateLimitedRedirect({
      request,
      path: `/admin/products/${id}`,
      result: rateLimit,
      statusValue: "Too many inventory changes. Try again shortly.",
    });
  }

  const formData = await request.formData();

  try {
    await adjustAdminProductInventory({
      productId: id,
      ...parseInventoryAdjustmentFormData(formData),
    });
  } catch (error) {
    const url = new URL(`/admin/products/${id}`, request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to adjust inventory.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);

  return NextResponse.redirect(new URL(`/admin/products/${id}?saved=1`, request.url), {
    status: 303,
  });
}
