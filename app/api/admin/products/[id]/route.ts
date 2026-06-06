import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  parseProductFormData,
  updateAdminProduct,
} from "@/lib/admin/catalog";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  const formData = await request.formData();

  try {
    await updateAdminProduct(id, parseProductFormData(formData, "update"));
  } catch (error) {
    const url = new URL(`/admin/products/${id}`, request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to update product.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);

  return NextResponse.redirect(new URL(`/admin/products/${id}?saved=1`, request.url), {
    status: 303,
  });
}
