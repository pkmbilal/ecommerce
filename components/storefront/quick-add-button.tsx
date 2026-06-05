"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";

type QuickAddButtonProps = {
  productTitle: string;
};

export function QuickAddButton({ productTitle }: QuickAddButtonProps) {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      aria-label={`${added ? "Added" : "Quick add"} ${productTitle}`}
      onClick={() => setAdded(true)}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
      {added ? "Added" : "Quick add"}
    </button>
  );
}
