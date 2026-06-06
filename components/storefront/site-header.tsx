import { CircleUserRound, Menu, Search } from "lucide-react";
import Link from "next/link";

import { CartNavButton } from "@/components/cart/cart-nav-button";
import { navItems } from "@/lib/storefront-data";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="bg-zinc-950 px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        Free Riyadh delivery over SAR 350. Cash on delivery available across KSA.
      </div>
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 lg:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>

        <Link href="/" className="text-2xl font-black tracking-tight">
          SAHA
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item}
              href="/products"
              className="text-sm font-semibold text-zinc-700 transition hover:text-emerald-800"
            >
              {item}
            </Link>
          ))}
        </nav>

        <form
          role="search"
          className="ml-auto hidden h-11 min-w-72 items-center gap-2 rounded-full bg-zinc-100 px-4 md:flex"
        >
          <Search aria-hidden="true" className="size-4 text-zinc-500" />
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search abayas, bags, scarves"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200 md:hidden"
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
          <CartNavButton />
          <Link
            href="/account"
            aria-label="Account"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-200"
          >
            <CircleUserRound aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
