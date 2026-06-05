import { ArrowLeft, ShieldCheck, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuickAddButton } from "@/components/storefront/quick-add-button";
import { SiteHeader } from "@/components/storefront/site-header";
import { calculateDiscountPercent, formatSar } from "@/lib/money";
import { getProductBySlug } from "@/lib/products/queries";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found | SAHA",
    };
  }

  return {
    title: `${product.title} | SAHA`,
    description:
      product.description ??
      `Shop ${product.title} with SAR pricing and cash on delivery.`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const discount = calculateDiscountPercent(
    product.priceHalalas,
    product.compareAtPriceHalalas,
  );
  const primaryImage = product.images[0] ?? {
    url: product.imageUrl,
    alt: product.imageAlt,
  };

  return (
    <>
      <SiteHeader />
      <main className="bg-[#fbfaf7]">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700 transition hover:text-emerald-800"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to products
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.28fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-zinc-200">
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
                {product.images.slice(0, 3).map((image) => (
                  <div
                    key={image.url}
                    className="relative aspect-square overflow-hidden rounded-lg bg-zinc-200"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 30vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
                {product.category}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
                {product.title}
              </h1>
              <div className="mt-5 flex items-center gap-3 text-sm text-zinc-600">
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      aria-hidden="true"
                      className={`size-5 ${
                        index + 1 <= Math.round(product.rating)
                          ? "fill-current"
                          : "fill-none"
                      }`}
                    />
                  ))}
                </span>
                <span>
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-black text-zinc-950">
                  {formatSar(product.priceHalalas)}
                </span>
                {product.compareAtPriceHalalas ? (
                  <span className="text-lg font-semibold text-zinc-400 line-through">
                    {formatSar(product.compareAtPriceHalalas)}
                  </span>
                ) : null}
                {discount ? (
                  <span className="rounded-full bg-rose-600 px-3 py-1 text-sm font-bold text-white">
                    -{discount}%
                  </span>
                ) : null}
              </div>

              {product.description ? (
                <p className="mt-6 max-w-xl text-base leading-8 text-zinc-700">
                  {product.description}
                </p>
              ) : null}

              <div className="mt-8 max-w-sm">
                <QuickAddButton productTitle={product.title} />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                  <Truck aria-hidden="true" className="size-5 text-emerald-800" />
                  <p className="mt-3 text-sm font-bold text-zinc-950">
                    Cash on delivery
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    COD available across Saudi Arabia.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-5 text-emerald-800"
                  />
                  <p className="mt-3 text-sm font-bold text-zinc-950">
                    Trusted totals
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Final totals are recalculated server-side at checkout.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                SKU {product.sku}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
