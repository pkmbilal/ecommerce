import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SectionHeader } from "@/components/storefront/section-header";
import { SiteHeader } from "@/components/storefront/site-header";
import { getCategoryTiles } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Categories | SAHA",
  description:
    "Shop SAHA categories with clear SAR pricing and delivery across Saudi Arabia.",
};

export default async function CategoriesPage() {
  const categories = await getCategoryTiles();

  return (
    <>
      <SiteHeader />
      <main className="bg-[#f8f5ef]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white/65 p-5 shadow-[0_24px_70px_-54px_rgba(20,18,15,0.75)] sm:p-8">
            <SectionHeader
              kicker="Shop the edit"
              title="All categories"
            />
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Browse every SAHA collection, from polished everyday layers to
              finishing pieces for work, weekends, and gifting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className={`group relative block overflow-hidden rounded-[1.35rem] bg-zinc-200 shadow-[0_24px_60px_-44px_rgba(20,18,15,0.75)] ring-1 ring-stone-200/70 ${
                  index === 0 ? "aspect-[5/4] lg:col-span-2" : "aspect-[4/5]"
                }`}
              >
                <Image
                  src={category.imageUrl}
                  alt={`${category.name} category`}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 66vw"
                      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  }
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/86 via-zinc-950/18 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                  <span className="block text-2xl font-black">
                    {category.name}
                  </span>
                  {category.description ? (
                    <span className="mt-2 block max-w-md text-sm font-semibold leading-6 text-white/82">
                      {category.description}
                    </span>
                  ) : null}
                  <span className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-zinc-950 transition group-hover:bg-emerald-700 group-hover:text-white">
                    Shop category
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
