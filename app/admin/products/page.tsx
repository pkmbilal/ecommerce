import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AdminShell } from "@/app/admin/orders/page";
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
  }>;
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const page = parsePage(getSingleParam(params.page));
  const query = getSingleParam(params.q)?.trim();
  const products = await listAdminProducts({ page, query });

  return (
    <AdminShell
      title="Products"
      subtitle="Manage catalog visibility, pricing, media, and stock."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/admin/products" className="flex min-w-0 flex-1 gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search title, SKU, or slug"
            className="h-11 min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-700"
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white"
          >
            Search
          </button>
        </form>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-800 px-5 text-sm font-bold text-white"
        >
          New product
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 max-lg:hidden">
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
              className="grid gap-4 border-b border-zinc-100 px-4 py-4 transition hover:bg-emerald-50 lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-zinc-100">
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
                  <p className="truncate font-black text-zinc-950">
                    {product.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {product.sku} - {product.slug}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-zinc-700">
                {product.categoryName ?? "Unassigned"}
              </p>
              <div className="text-sm font-bold text-zinc-700">
                <p>{product.stockOnHand} on hand</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {product.reservedQuantity} reserved
                </p>
              </div>
              <p className="font-black text-zinc-950">
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
            <h2 className="text-xl font-black text-zinc-950">
              No products found
            </h2>
            <p className="mt-2 text-zinc-600">
              Add a product or refine the current search.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {products.page > 1 ? (
          <Link
            href={buildPageHref(query, products.page - 1)}
            className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Previous
          </Link>
        ) : null}
        {products.hasNextPage ? (
          <Link
            href={buildPageHref(query, products.page + 1)}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </AdminShell>
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
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
        isActive ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {children}
    </span>
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
