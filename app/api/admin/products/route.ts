import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  createAdminProduct,
  parseProductFormData,
} from "@/lib/admin/catalog";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  let productId: string;

  try {
    productId = await createAdminProduct(parseProductFormData(formData, "create"));
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

  return NextResponse.redirect(new URL(`/admin/products/${productId}?saved=1`, request.url), {
    status: 303,
  });
}
