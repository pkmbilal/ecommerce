import { Star } from "lucide-react";
import Image from "next/image";

import type { Product } from "@/lib/storefront-data";
import { calculateDiscountPercent, formatSar } from "@/lib/money";
import { QuickAddButton } from "./quick-add-button";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const discount = calculateDiscountPercent(
    product.priceHalalas,
    product.compareAtPriceHalalas,
  );

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-stone-100">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.badge ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-950 shadow-sm">
              {product.badge}
            </span>
          ) : null}
          {discount ? (
            <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              -{discount}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {product.category}
          </p>
          <h3 className="mt-1 min-h-12 text-base font-bold leading-6 text-zinc-950">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={`size-4 ${
                  index + 1 <= Math.round(product.rating)
                    ? "fill-current"
                    : "fill-none"
                }`}
              />
            ))}
          </span>
          <span>
            {product.rating} ({product.reviews})
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-black text-zinc-950">
              {formatSar(product.priceHalalas)}
            </span>
            {product.compareAtPriceHalalas ? (
              <span className="text-sm font-semibold text-zinc-400 line-through">
                {formatSar(product.compareAtPriceHalalas)}
              </span>
            ) : null}
          </div>
        </div>

        <QuickAddButton productTitle={product.title} />
      </div>
    </article>
  );
}
