import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import {
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminProducts } from "@/lib/admin/catalog";
import { formatSar } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin Products | SAHA",
};

type AdminProductsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    saved?: string | string[];
  }>;
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const profile = await requireAdminSession();

  const params = await searchParams;
  const page = parsePage(getSingleParam(params.page));
  const query = getSingleParam(params.q)?.trim();
  const saved = getSingleParam(params.saved);
  const products = await listAdminProducts({ page, query });

  return (
    <TailAdminShell
      profile={profile}
      title="Products"
      subtitle="Manage catalog visibility, pricing, media, and stock."
      actions={
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          New product
        </Link>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {saved === "created" || saved === "updated" ? (
          <p className="rounded-lg bg-success-50 px-3 py-2 text-sm font-medium text-success-700">
            Product {saved === "created" ? "created" : "updated"} successfully.
          </p>
        ) : null}
        <form action="/admin/products" className="flex min-w-0 flex-1 gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search title, SKU, or slug"
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      <AdminPanel className="mt-6 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-500 max-lg:hidden">
          <span>Product</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {products.items.length > 0 ? (
          products.items.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}`}
              className="grid gap-4 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50 lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {product.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {product.sku} - {product.slug}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {product.categoryName ?? "Unassigned"}
              </p>
              <div className="text-sm font-medium text-gray-700">
                <p>{product.stockOnHand} on hand</p>
                <p className="mt-1 text-xs text-gray-500">
                  {product.reservedQuantity} reserved
                </p>
              </div>
              <p className="font-semibold text-gray-900">
                {formatSar(product.priceHalalas)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Flag isActive={product.isActive}>Active</Flag>
                {product.isFeatured ? <Flag isActive>Featured</Flag> : null}
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No products found
            </h2>
            <p className="mt-2 text-gray-500">
              Add a product or refine the current search.
            </p>
          </div>
        )}
      </AdminPanel>

      <div className="mt-8 flex justify-center gap-3">
        {products.page > 1 ? (
          <Link
            href={buildPageHref(query, products.page - 1)}
            className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900"
          >
            Previous
          </Link>
        ) : null}
        {products.hasNextPage ? (
          <Link
            href={buildPageHref(query, products.page + 1)}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </TailAdminShell>
  );
}

function Flag({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminStatusBadge tone={isActive ? "success" : "neutral"}>
      {children}
    </AdminStatusBadge>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildPageHref(query: string | undefined, page: number) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}
