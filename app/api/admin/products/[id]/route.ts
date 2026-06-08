import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  archiveAdminProduct,
  parseProductFormData,
  setAdminProductActive,
  updateAdminProduct,
} from "@/lib/admin/catalog";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/products", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const intent = getIntent(formData);

  try {
    if (intent === "set-active") {
      const isActive = parseBooleanFormField(formData, "isActive");
      const { slug } = await setAdminProductActive(id, isActive);
      revalidateProductPaths({ id, slug });

      return NextResponse.redirect(
        new URL(`/admin/products?saved=${isActive ? "enabled" : "disabled"}`, request.url),
        { status: 303 },
      );
    }

    if (intent === "archive") {
      const { slug } = await archiveAdminProduct(id);
      revalidateProductPaths({ id, slug });

      return NextResponse.redirect(
        new URL("/admin/products?saved=archived", request.url),
        { status: 303 },
      );
    }

    const input = await parseProductFormData(formData, "update");
    await updateAdminProduct(id, input);
    revalidateProductPaths({ id, slug: input.slug });
  } catch (error) {
    const url = new URL(`/admin/products/${id}`, request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to update product.",
    );

    return NextResponse.redirect(url, { status: 303 });
  }

  return NextResponse.redirect(new URL("/admin/products?saved=updated", request.url), {
    status: 303,
  });
}

function getIntent(formData: FormData) {
  const intent = formData.get("intent");

  return typeof intent === "string" ? intent : "update";
}

function parseBooleanFormField(formData: FormData, name: string) {
  const value = formData.get(name);

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("Invalid product status action.");
}

function revalidateProductPaths({ id, slug }: { id: string; slug: string }) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
}
