import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel } from "@/components/admin/tailadmin/primitives";
import { QuickAddButton } from "@/components/storefront/quick-add-button";
import { requireCustomerSession } from "@/lib/admin/auth";
import {
  getCustomerProfile,
  listCustomerFavorites,
} from "@/lib/customer/account";
import { calculateDiscountPercent, formatSar } from "@/lib/money";

export const metadata: Metadata = {
  title: "Favorites | SAHA Account",
};

export default async function FavoritesPage() {
  const session = await requireCustomerSession();
  const [profile, favorites] = await Promise.all([
    getCustomerProfile(session.userId),
    listCustomerFavorites(session.userId),
  ]);

  return (
    <AccountShell
      profile={profile}
      title="Favorites"
      subtitle="Saved products you can revisit and add to your COD cart quickly."
    >
      <AdminPanel title="Saved products" description={`${favorites.length} products saved.`}>
        {favorites.length > 0 ? (
          <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {favorites.map((product) => {
              const discount = calculateDiscountPercent(
                product.priceHalalas,
                product.compareAtPriceHalalas,
              );

              return (
                <article key={product.productId} className="flex h-full flex-col">
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative aspect-[4/5] overflow-hidden rounded-lg bg-stone-100"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                    {discount ? (
                      <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        -{discount}%
                      </span>
                    ) : null}
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        {product.category}
                      </p>
                      <h2 className="mt-1 min-h-12 text-base font-bold leading-6 text-zinc-950">
                        <Link href={`/products/${product.slug}`}>{product.title}</Link>
                      </h2>
                    </div>
                    <div className="mt-auto flex flex-wrap items-baseline gap-2">
                      <span className="text-xl font-black text-zinc-950">
                        {formatSar(product.priceHalalas)}
                      </span>
                      {product.compareAtPriceHalalas ? (
                        <span className="text-sm font-semibold text-zinc-400 line-through">
                          {formatSar(product.compareAtPriceHalalas)}
                        </span>
                      ) : null}
                    </div>
                    <QuickAddButton productId={product.slug} productTitle={product.title} />
                    <form action="/api/account/favorites" method="post">
                      <input type="hidden" name="intent" value="remove" />
                      <input type="hidden" name="productId" value={product.productId} />
                      <input type="hidden" name="returnTo" value="/account/favorites" />
                      <button
                        type="submit"
                        className="inline-flex h-10 w-full items-center justify-center rounded-full border border-gray-200 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Remove favorite
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Heart aria-hidden="true" className="mx-auto size-10 text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No favorites yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Save products from the catalog to compare them later.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse products
            </Link>
          </div>
        )}
      </AdminPanel>
    </AccountShell>
  );
}
