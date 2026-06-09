import { ArrowRight, Check, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MotionReveal } from "@/components/storefront/motion-reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeader } from "@/components/storefront/section-header";
import { SiteHeader } from "@/components/storefront/site-header";
import { getCurrentProfile } from "@/lib/admin/auth";
import { getFavoriteProductSlugs } from "@/lib/customer/account";
import {
  getCategoryTiles,
  getStorefrontProducts,
} from "@/lib/products/queries";
import {
  brandStrip,
  heroImages,
  reviews,
} from "@/lib/storefront-data";

export default async function Home() {
  const [newArrivals, bestSellers, categoryTiles, profile] = await Promise.all([
    getStorefrontProducts({ limit: 4 }),
    getStorefrontProducts({ limit: 4, offset: 2, featuredOnly: true }),
    getCategoryTiles({ limit: 4 }),
    getCurrentProfile(),
  ]);
  const favoriteSlugs = profile
    ? await getFavoriteProductSlugs(profile.userId)
    : new Set<string>();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="overflow-hidden bg-[#f8f5ef]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:py-14 lg:px-8">
            <MotionReveal className="flex flex-col justify-center">
              <p className="mb-4 w-fit rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-black text-emerald-800 shadow-sm">
                COD-first shopping for Saudi Arabia
              </p>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
                Elevated essentials for everyday Saudi style.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-700">
                Refined abayas, soft accessories, and weekend edits with clear
                SAR pricing, VAT-ready totals, and cash on delivery.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-black text-white shadow-[0_22px_45px_-28px_rgba(20,18,15,0.85)] transition hover:bg-emerald-800"
                >
                  Shop new arrivals
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-6 text-sm font-black text-zinc-950 transition hover:border-zinc-950 hover:bg-white"
                >
                  Explore categories
                </Link>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-stone-300 pt-6">
                {[
                  ["SAR", "transparent prices"],
                  ["COD", "across KSA"],
                  ["Easy", "checkout"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-2xl font-black tracking-tight text-zinc-950">
                      {value}
                    </dt>
                    <dd className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-600">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </MotionReveal>

            <MotionReveal delay={0.1} className="relative min-h-[520px]">
              <div className="absolute left-0 top-8 h-[76%] w-[70%] overflow-hidden rounded-[1.75rem] bg-zinc-200 shadow-[0_38px_90px_-46px_rgba(20,18,15,0.95)] ring-1 ring-white/50">
                <Image
                  src={heroImages.main}
                  alt="Premium perfume bottle styled on a warm editorial set"
                  fill
                  priority
                  sizes="(max-width: 768px) 70vw, 38vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-0 h-[58%] w-[52%] overflow-hidden rounded-[1.35rem] border-8 border-[#f8f5ef] bg-zinc-200 shadow-[0_26px_60px_-34px_rgba(20,18,15,0.75)]">
                <Image
                  src={heroImages.secondary}
                  alt="Refined wristwatch photographed on a clean product set"
                  fill
                  sizes="(max-width: 768px) 55vw, 28vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-5 top-2 rounded-2xl border border-stone-200 bg-white/92 p-4 shadow-xl backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  New arrivals
                </p>
                <p className="mt-1 text-2xl font-black text-zinc-950">
                  Perfume &amp; watches
                </p>
              </div>
            </MotionReveal>
          </div>
        </section>

        <section aria-label="Featured labels" className="bg-zinc-950 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 sm:px-6 lg:px-8">
            {brandStrip.map((brand) => (
              <span
                key={brand}
                className="text-xl font-black tracking-[0.22em] text-white/80 sm:text-2xl"
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Fresh this week"
            title="New arrivals"
            href="/products"
          />
          <MotionReveal className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
            {newArrivals.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteSlugs.has(product.id)}
                returnTo="/"
              />
            ))}
          </MotionReveal>
        </section>

        <section className="bg-white/55 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              kicker="Customer favorites"
              title="Best sellers"
              href="/products"
            />
            <MotionReveal className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {bestSellers.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteSlugs.has(product.id)}
                  returnTo="/"
                />
              ))}
            </MotionReveal>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Shop by mood"
            title="Curated categories"
            href="/categories"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryTiles.map((category, index) => (
              <MotionReveal key={category.name} delay={index * 0.06}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-zinc-200 shadow-[0_24px_60px_-44px_rgba(20,18,15,0.75)] ring-1 ring-stone-200/70"
                >
                  <Image
                    src={category.imageUrl}
                    alt={`${category.name} category`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-zinc-950/86 via-zinc-950/18 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="block text-xl font-black">
                      {category.name}
                    </span>
                    {category.description ? (
                      <span className="mt-2 block text-sm font-semibold leading-5 text-white/82">
                        {category.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="bg-[#e6eee7] py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <MotionReveal>
              <p className="editorial-kicker">
                A smoother way to shop
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
                Luxury picks delivered with clear prices and simple checkout.
              </h2>
            </MotionReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [Truck, "Pay on delivery", "Order with confidence across Saudi Arabia."],
                [ShieldCheck, "Clear SAR pricing", "See product prices and totals before you confirm."],
                [Check, "Fast local delivery", "Prepared for smooth doorstep handoff."],
              ].map(([Icon, title, text]) => (
                <MotionReveal key={title as string}>
                  <div className="premium-panel h-full rounded-2xl p-5">
                    <Icon aria-hidden="true" className="size-6 text-emerald-800" />
                    <h3 className="mt-5 text-lg font-black text-zinc-950">
                      {title as string}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {text as string}
                    </p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader kicker="Reviews" title="What customers say" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((review, index) => (
              <MotionReveal key={review.name} delay={index * 0.06}>
                <figure className="premium-panel h-full rounded-2xl p-6">
                  <blockquote className="text-lg font-semibold leading-8 text-zinc-900">
                    &quot;{review.quote}&quot;
                  </blockquote>
                  <figcaption className="mt-6 text-sm text-zinc-600">
                    <span className="font-bold text-zinc-950">{review.name}</span>
                    {" - "}
                    {review.city}
                  </figcaption>
                </figure>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] bg-zinc-950 px-5 py-8 text-white shadow-[0_30px_80px_-42px_rgba(20,18,15,0.9)] sm:px-8 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Style notes
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-black tracking-tight">
                Get new drops and delivery updates in your inbox.
              </h2>
            </div>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                className="h-12 min-w-0 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 outline-none placeholder:text-zinc-500 sm:w-80"
              />
              <button
                type="submit"
                className="h-12 rounded-full bg-emerald-700 px-6 text-sm font-black text-white transition hover:bg-emerald-600"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-zinc-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-xl font-black text-zinc-950">SAHA</p>
          <p>Luxury watches and fragrances with simple Saudi delivery.</p>
          <div className="flex gap-4 font-semibold">
            <Link href="/products">Products</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/account">Account</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
