import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/orders/page";
import { ProductForm } from "@/app/admin/products/product-form";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAdminProductDetail,
  listAdminCategories,
} from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Edit Product | SAHA Admin",
};

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string | string[];
    saved?: string | string[];
  }>;
};

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  await requireAdminSession();

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    getAdminProductDetail(id),
    listAdminCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <AdminShell
      title={product.title}
      subtitle="Edit catalog data, media metadata, and inventory settings."
    >
      <ProductForm
        action={`/api/admin/products/${product.id}`}
        categories={categories}
        product={product}
        error={getSingleParam(query.error)}
        saved={getSingleParam(query.saved) === "1"}
        mode="update"
      />
    </AdminShell>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
