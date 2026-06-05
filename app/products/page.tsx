import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeader } from "@/components/storefront/section-header";
import { SiteHeader } from "@/components/storefront/site-header";
import {
  getCategories,
  getStorefrontProducts,
} from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Products | SAHA",
  description:
    "Browse SAHA products with SAR pricing and cash on delivery across Saudi Arabia.",
};

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    page?: string | string[];
  }>;
};

const PAGE_SIZE = 8;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = await searchParams;
  const category = getSingleParam(query.category);
  const page = parsePage(getSingleParam(query.page));
  const offset = (page - 1) * PAGE_SIZE;
  const [categories, products] = await Promise.all([
    getCategories(),
    getStorefrontProducts({
      categorySlug: category,
      limit: PAGE_SIZE,
      offset,
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-[#fbfaf7]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Catalog"
            title={category ? "Filtered products" : "All products"}
          />

          <nav
            aria-label="Product categories"
            className="mt-8 flex gap-2 overflow-x-auto pb-2"
          >
            <CategoryLink href="/products" isActive={!category}>
              All
            </CategoryLink>
            {categories.map((item) => (
              <CategoryLink
                key={item.id}
                href={`/products?category=${item.slug}`}
                isActive={category === item.slug}
              >
                {item.name}
              </CategoryLink>
            ))}
          </nav>

          <div className="mt-8 flex items-center justify-between gap-4 text-sm font-semibold text-zinc-600">
            <p>
              Showing {products.items.length} of {products.total} products
            </p>
            {category ? (
              <Link href="/products" className="text-emerald-800 underline">
                Clear filter
              </Link>
            ) : null}
          </div>

          {products.items.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 text-center">
              <h2 className="text-2xl font-black text-zinc-950">
                No products found
              </h2>
              <p className="mt-2 text-zinc-600">
                Try another category or browse the full catalog.
              </p>
            </div>
          )}

          <div className="mt-12 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={buildPageHref(category, page - 1)}
                className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-950"
              >
                Previous
              </Link>
            ) : null}
            {products.hasNextPage ? (
              <Link
                href={buildPageHref(category, page + 1)}
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white"
              >
                Next page
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}

function CategoryLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        isActive
          ? "bg-zinc-950 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950"
      }`}
    >
      {children}
    </Link>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildPageHref(category: string | undefined, page: number) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}
