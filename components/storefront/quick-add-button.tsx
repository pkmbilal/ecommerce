"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";

type QuickAddButtonProps = {
  productTitle: string;
  productId: string;
};

export function QuickAddButton({ productTitle, productId }: QuickAddButtonProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  return (
    <button
      type="button"
      aria-label={`${added ? "Added" : "Quick add"} ${productTitle}`}
      onClick={() => {
        addItem(productId);
        setAdded(true);
      }}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 text-sm font-bold text-white shadow-[0_14px_30px_-22px_rgba(20,18,15,0.8)] transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
      {added ? "Added" : "Quick add"}
    </button>
  );
}
