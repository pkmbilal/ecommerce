import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import {
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  listAdminCategories,
  listAdminProducts,
  type AdminCategory,
  type AdminProductFeaturedFilter,
  type AdminProductFilters,
  type AdminProductMediaFilter,
  type AdminProductSort,
  type AdminProductStatusFilter,
  type AdminProductStockFilter,
} from "@/lib/admin/catalog";
import { formatSar } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin Products | SAHA",
};

type AdminProductsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    saved?: string | string[];
    status?: string | string[];
    featured?: string | string[];
    category?: string | string[];
    stock?: string | string[];
    media?: string | string[];
    sort?: string | string[];
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
  const categories = await listAdminCategories();
  const filters = parseAdminProductFilters(params);

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
        <Form
          action="/admin/products"
          scroll={false}
          className="flex min-w-0 flex-1 gap-2"
        >
          <FilterHiddenInputs filters={filters} />
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
        </Form>
      </div>

      <ProductFilterBar
        categories={categories}
        filters={filters}
        query={query}
      />

      <Suspense
        key={`${query ?? ""}:${page}:${getFilterKey(filters)}`}
        fallback={<AdminProductsResultsSkeleton />}
      >
        <AdminProductsResults query={query} page={page} filters={filters} />
      </Suspense>
    </TailAdminShell>
  );
}

function ProductFilterBar({
  categories,
  filters,
  query,
}: {
  categories: AdminCategory[];
  filters: AdminProductFilters;
  query?: string;
}) {
  const hasActiveFilters = hasAnyProductFilter(filters) || Boolean(query);

  return (
    <AdminPanel className="mt-5 p-4">
      <Form
        action="/admin/products"
        scroll={false}
        className="grid gap-4 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]"
      >
        {query ? <input type="hidden" name="q" value={query} /> : null}
        <SelectFilter
          label="Status"
          name="status"
          value={filters.status}
          options={[
            ["", "All statuses"],
            ["active", "Active"],
            ["inactive", "Inactive"],
          ]}
        />
        <SelectFilter
          label="Featured"
          name="featured"
          value={filters.featured}
          options={[
            ["", "All products"],
            ["featured", "Featured"],
            ["standard", "Not featured"],
          ]}
        />
        <SelectFilter
          label="Category"
          name="category"
          value={filters.categoryId}
          options={[
            ["", "All categories"],
            ["unassigned", "Unassigned"],
            ...categories.map((category) => [category.id, category.name] as const),
          ]}
        />
        <SelectFilter
          label="Stock"
          name="stock"
          value={filters.stock}
          options={[
            ["", "All stock"],
            ["in_stock", "In stock"],
            ["out_of_stock", "Out of stock"],
            ["reserved", "Reserved"],
          ]}
        />
        <SelectFilter
          label="Media"
          name="media"
          value={filters.media}
          options={[
            ["", "All media"],
            ["with_image", "Has image"],
            ["missing_image", "Missing image"],
          ]}
        />
        <SelectFilter
          label="Sort"
          name="sort"
          value={filters.sort}
          options={[
            ["", "Newest"],
            ["title_asc", "Title A-Z"],
            ["price_asc", "Price low"],
            ["price_desc", "Price high"],
            ["stock_asc", "Lowest stock"],
          ]}
        />
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Apply
          </button>
          {hasActiveFilters ? (
            <Link
              href="/admin/products"
              scroll={false}
              className="inline-flex h-11 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </Form>
    </AdminPanel>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-gray-700">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue || "all"} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

async function AdminProductsResults({
  query,
  page,
  filters,
}: {
  query?: string;
  page: number;
  filters: AdminProductFilters;
}) {
  const products = await listAdminProducts({ page, query, filters });

  return (
    <>
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
            href={buildPageHref(query, filters, products.page - 1)}
            scroll={false}
            className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900"
          >
            Previous
          </Link>
        ) : null}
        {products.hasNextPage ? (
          <Link
            href={buildPageHref(query, filters, products.page + 1)}
            scroll={false}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </>
  );
}

function AdminProductsResultsSkeleton() {
  return (
    <>
      <AdminPanel className="mt-6 overflow-hidden" aria-busy="true">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-500 max-lg:hidden">
          <span>Product</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.5fr] lg:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-14 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-48 max-w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-3 h-3 w-32 max-w-full animate-pulse rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </AdminPanel>

      <div className="mt-8 flex justify-center gap-3">
        <div className="h-11 w-24 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-11 w-28 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </>
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

function buildPageHref(
  query: string | undefined,
  filters: AdminProductFilters,
  page: number,
) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  setFilterSearchParams(params, filters);

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}

function FilterHiddenInputs({ filters }: { filters: AdminProductFilters }) {
  return (
    <>
      {filters.status ? (
        <input type="hidden" name="status" value={filters.status} />
      ) : null}
      {filters.featured ? (
        <input type="hidden" name="featured" value={filters.featured} />
      ) : null}
      {filters.categoryId ? (
        <input type="hidden" name="category" value={filters.categoryId} />
      ) : null}
      {filters.stock ? <input type="hidden" name="stock" value={filters.stock} /> : null}
      {filters.media ? <input type="hidden" name="media" value={filters.media} /> : null}
      {filters.sort ? <input type="hidden" name="sort" value={filters.sort} /> : null}
    </>
  );
}

function parseAdminProductFilters(
  params: Awaited<AdminProductsPageProps["searchParams"]>,
): AdminProductFilters {
  const status = parseOneOf<AdminProductStatusFilter>(
    getSingleParam(params.status),
    ["active", "inactive"],
  );
  const featured = parseOneOf<AdminProductFeaturedFilter>(
    getSingleParam(params.featured),
    ["featured", "standard"],
  );
  const stock = parseOneOf<AdminProductStockFilter>(getSingleParam(params.stock), [
    "in_stock",
    "out_of_stock",
    "reserved",
  ]);
  const media = parseOneOf<AdminProductMediaFilter>(getSingleParam(params.media), [
    "with_image",
    "missing_image",
  ]);
  const sort = parseOneOf<AdminProductSort>(getSingleParam(params.sort), [
    "newest",
    "title_asc",
    "price_asc",
    "price_desc",
    "stock_asc",
  ]);
  const categoryId = getSingleParam(params.category)?.trim();

  return {
    status,
    featured,
    categoryId: categoryId || undefined,
    stock,
    media,
    sort,
  };
}

function parseOneOf<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
): T | undefined {
  return allowedValues.includes(value as T) ? (value as T) : undefined;
}

function setFilterSearchParams(
  params: URLSearchParams,
  filters: AdminProductFilters,
) {
  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.featured) {
    params.set("featured", filters.featured);
  }

  if (filters.categoryId) {
    params.set("category", filters.categoryId);
  }

  if (filters.stock) {
    params.set("stock", filters.stock);
  }

  if (filters.media) {
    params.set("media", filters.media);
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }
}

function hasAnyProductFilter(filters: AdminProductFilters) {
  return Boolean(
    filters.status ||
      filters.featured ||
      filters.categoryId ||
      filters.stock ||
      filters.media ||
      filters.sort,
  );
}

function getFilterKey(filters: AdminProductFilters) {
  const params = new URLSearchParams();
  setFilterSearchParams(params, filters);

  return params.toString();
}
