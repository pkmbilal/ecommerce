import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  applyAdminProductBulkAction,
  parseProductBulkActionFormData,
} from "@/lib/admin/catalog";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/products", request.url), {
      status: 303,
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
