import { Menu, Search } from "lucide-react";
import Link from "next/link";

import { AccountProfileMenu } from "@/components/account/account-profile-menu";
import { CartNavButton } from "@/components/cart/cart-nav-button";
import { getCurrentProfile } from "@/lib/admin/auth";
import { navItems } from "@/lib/storefront-data";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f8f5ef]/92 backdrop-blur-xl">
      <div className="bg-zinc-950 px-4 py-2 text-center text-xs font-bold tracking-wide text-white sm:text-sm">
        Free Riyadh delivery over SAR 350. Cash on delivery across KSA.
      </div>
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex size-10 items-center justify-center rounded-full border border-stone-300 bg-white/80 transition hover:border-zinc-950 lg:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>

        <Link href="/" className="text-2xl font-black tracking-tight text-zinc-950">
          SAHA
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item}
              href="/products"
              className="text-sm font-bold text-zinc-700 transition hover:text-emerald-800"
            >
              {item}
            </Link>
          ))}
        </nav>

        <form
          role="search"
          className="ml-auto hidden h-11 min-w-72 items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 shadow-sm md:flex"
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
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex size-10 items-center justify-center rounded-full border border-stone-300 bg-white/80 transition hover:border-zinc-950 md:hidden"
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
          <CartNavButton />
          {profile ? (
            <AccountProfileMenu
              email={profile.email}
              fullName={profile.fullName}
              avatarUrl={profile.avatarUrl}
              variant="avatar"
            />
          ) : (
            <Link
              href="/login?next=/account"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-3 text-xs font-black text-zinc-950 transition hover:border-zinc-950 hover:bg-white sm:px-4 sm:text-sm"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
