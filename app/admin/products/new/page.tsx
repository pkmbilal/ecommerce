import type { Metadata } from "next";

import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import { ProductForm } from "@/app/admin/products/product-form";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "New Product | SAHA Admin",
};

type NewProductPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const profile = await requireAdminSession();

  const params = await searchParams;
  const categories = await listAdminCategories();

  return (
    <TailAdminShell
      profile={profile}
      title="New product"
      subtitle="Create a storefront product with pricing, stock, and media."
    >
      <ProductForm
        action="/api/admin/products"
        categories={categories}
        error={getSingleParam(params.error)}
        mode="create"
      />
    </TailAdminShell>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
