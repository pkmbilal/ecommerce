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
      className="relative inline-flex size-10 items-center justify-center rounded-full border border-zinc-200"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 text-xs font-black text-white">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
