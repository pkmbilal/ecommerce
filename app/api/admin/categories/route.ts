import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  createAdminCategory,
  parseCategoryFormData,
} from "@/lib/admin/catalog";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();

  try {
    await createAdminCategory(parseCategoryFormData(formData));
  } catch (error) {
    return redirectWithError(
      request,
      "/admin/categories",
      error instanceof Error ? error.message : "Unable to create category.",
    );
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/categories");

  return NextResponse.redirect(new URL("/admin/categories?saved=1", request.url), {
    status: 303,
  });
}

function redirectWithError(request: Request, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, { status: 303 });
}
