"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "./cart-provider";

export function CartNavButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      type="button"
      aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
      onClick={openCart}
      className="relative inline-flex size-10 items-center justify-center rounded-full border border-stone-300 bg-white/80 transition hover:border-zinc-950"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-800 px-1.5 text-xs font-black text-white ring-2 ring-[#f8f5ef]">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
