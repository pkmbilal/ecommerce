import { ArrowRight, Check, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MotionReveal } from "@/components/storefront/motion-reveal";
import { ProductCard } from "@/components/storefront/product-card";
import { SiteHeader } from "@/components/storefront/site-header";
import { getStorefrontProducts } from "@/lib/products/queries";
import {
  brandStrip,
  categories,
  heroImages,
  reviews,
} from "@/lib/storefront-data";

export default async function Home() {
  const products = await getStorefrontProducts();
  const newArrivals = products.slice(0, 4);
  const bestSellers = products.slice(2, 6);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="overflow-hidden bg-[#f4f0e8]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:py-14 lg:px-8">
            <MotionReveal className="flex flex-col justify-center">
              <p className="mb-4 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
                COD-first shopping for Saudi Arabia
              </p>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
                Everyday style made clear, modest, and easy.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-700">
                Shop refined essentials, elevated abayas, soft accessories, and
                weekend edits with transparent SAR pricing and cash on delivery.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#products"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  Shop new arrivals
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-bold text-zinc-950 transition hover:border-zinc-950"
                >
                  Explore categories
                </Link>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-300 pt-6">
                {[
                  ["1,200+", "orders delivered"],
                  ["24h", "Riyadh dispatch"],
                  ["15%", "VAT ready logic"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-2xl font-black text-zinc-950">
                      {value}
                    </dt>
                    <dd className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </MotionReveal>

            <MotionReveal delay={0.1} className="relative min-h-[520px]">
              <div className="absolute left-0 top-8 h-[74%] w-[68%] overflow-hidden rounded-lg bg-zinc-200 shadow-2xl">
                <Image
                  src={heroImages.main}
                  alt="Editorial fashion model wearing a structured black look"
                  fill
                  priority
                  sizes="(max-width: 768px) 70vw, 38vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-0 h-[58%] w-[52%] overflow-hidden rounded-lg border-8 border-[#f4f0e8] bg-zinc-200 shadow-xl">
                <Image
                  src={heroImages.secondary}
                  alt="Minimal fashion styling with neutral modest layers"
                  fill
                  sizes="(max-width: 768px) 55vw, 28vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-5 top-2 rounded-lg bg-white p-4 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  COD orders
                </p>
                <p className="mt-1 text-2xl font-black text-zinc-950">100%</p>
              </div>
            </MotionReveal>
          </div>
        </section>

        <section aria-label="Featured labels" className="bg-zinc-950 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 sm:px-6 lg:px-8">
            {brandStrip.map((brand) => (
              <span
                key={brand}
                className="text-xl font-black tracking-[0.18em] text-white/85 sm:text-2xl"
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
            href="#products"
          />
          <MotionReveal className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </MotionReveal>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              kicker="Customer favorites"
              title="Best sellers"
              href="#products"
            />
            <MotionReveal className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </MotionReveal>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Shop by mood"
            title="Curated categories"
            href="#categories"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {categories.map((category, index) => (
              <MotionReveal key={category.name} delay={index * 0.06}>
                <Link
                  href="#products"
                  className="group relative block aspect-[5/4] overflow-hidden rounded-lg bg-zinc-200"
                >
                  <Image
                    src={category.imageUrl}
                    alt={`${category.name} fashion category`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-5 text-2xl font-black text-white">
                    {category.name}
                  </span>
                </Link>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="bg-[#e8f1eb] py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <MotionReveal>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
                Built for local checkout
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
                Simple buying, ready for Saudi delivery.
              </h2>
            </MotionReveal>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [Truck, "COD only", "No card or wallet flows in V1."],
                [ShieldCheck, "Server totals", "Prices and totals stay trusted."],
                [Check, "VAT ready", "Money logic is centralized for SAR."],
              ].map(([Icon, title, text]) => (
                <MotionReveal key={title as string}>
                  <div className="h-full rounded-lg bg-white p-5 shadow-sm">
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
                <figure className="h-full rounded-lg border border-zinc-200 bg-white p-6">
                  <blockquote className="text-lg font-semibold leading-8 text-zinc-900">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-6 text-sm text-zinc-600">
                    <span className="font-bold text-zinc-950">{review.name}</span>
                    {" · "}
                    {review.city}
                  </figcaption>
                </figure>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-zinc-950 px-5 py-8 text-white sm:px-8 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
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
                className="h-12 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-zinc-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-xl font-black text-zinc-950">SAHA</p>
          <p>Saudi-first ecommerce foundation. COD orders only for V1.</p>
          <div className="flex gap-4 font-semibold">
            <Link href="#products">Products</Link>
            <Link href="#categories">Categories</Link>
            <Link href="#account">Account</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function SectionHeader({
  kicker,
  title,
  href,
}: {
  kicker: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          {kicker}
        </p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden text-sm font-bold text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-emerald-700 sm:inline"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}
