"use client";

import { AlertCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CartSummary } from "@/lib/cart/types";
import { formatSar } from "@/lib/money";
import { calculateOrderTotalHalalas, calculateVatHalalas } from "@/lib/pricing";

export function CartPageClient() {
  const {
    items,
    summary: serverSummary,
    isServerCart,
    isLoaded,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const cartKey = JSON.stringify(items);
  const [summaryState, setSummaryState] = useState<{
    key: string;
    summary: CartSummary | null;
  }>({ key: "", summary: null });
  const summary = isServerCart
    ? serverSummary
    : summaryState.key === cartKey
      ? summaryState.summary
      : null;
  const isSummaryLoading =
    !isLoaded ||
    (items.length > 0 &&
      (isServerCart ? !serverSummary : summaryState.key !== cartKey));
  const estimatedVatHalalas = useMemo(
    () => calculateVatHalalas(summary?.estimatedSubtotalHalalas ?? 0),
    [summary?.estimatedSubtotalHalalas],
  );
  const estimatedTotalHalalas = calculateOrderTotalHalalas({
    subtotalHalalas: summary?.estimatedSubtotalHalalas ?? 0,
    vatHalalas: estimatedVatHalalas,
  });

  useEffect(() => {
    if (isServerCart || items.length === 0) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/cart/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load cart summary.");
        }

        return (await response.json()) as CartSummary;
      })
      .then((nextSummary) => {
        setSummaryState({ key: cartKey, summary: nextSummary });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSummaryState({ key: cartKey, summary: null });
        }
      });

    return () => controller.abort();
  }, [cartKey, isServerCart, items]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white/65 p-5 shadow-[0_24px_70px_-54px_rgba(20,18,15,0.75)] sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="editorial-kicker">
            Shopping cart
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Review your bag
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-700">
            Confirm quantities before checkout. Sign in is required before COD
            order creation, and final SAR totals, VAT, delivery, and stock are
            recalculated on the server.
          </p>
        </div>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-5 text-sm font-bold text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Clear cart
          </button>
        ) : null}
      </div>

      {!isLoaded ? (
        <div className="premium-panel mt-10 rounded-2xl p-8">
          <div className="h-8 w-44 animate-pulse rounded bg-zinc-100" />
          <div className="mt-6 space-y-4">
            <div className="h-28 animate-pulse rounded-lg bg-zinc-100" />
            <div className="h-28 animate-pulse rounded-lg bg-zinc-100" />
          </div>
        </div>
      ) : null}

      {isLoaded && items.length === 0 ? (
        <div className="premium-panel mt-10 rounded-2xl p-8 text-center">
          <ShoppingBag aria-hidden="true" className="mx-auto size-11 text-zinc-300" />
          <h2 className="mt-4 text-2xl font-black text-zinc-950">
            Your cart is empty
          </h2>
          <p className="mt-2 text-zinc-600">
            Add products to prepare your cash on delivery order.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Browse products
          </Link>
        </div>
      ) : null}

      {isLoaded && items.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="premium-panel overflow-hidden rounded-2xl">
            {isSummaryLoading ? (
              <div className="space-y-4 p-5 sm:p-6">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="h-28 animate-pulse rounded-lg bg-zinc-100"
                  />
                ))}
              </div>
            ) : null}

            {!isSummaryLoading && summary ? (
              <div className="divide-y divide-zinc-200">
                {summary.items.map((item) => (
                  <article
                    key={item.productId}
                    className="grid gap-4 p-5 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:p-6"
                  >
                    <div className="relative aspect-square w-28 overflow-hidden rounded-2xl bg-zinc-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-lg font-black text-zinc-950">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-zinc-600">
                        {formatSar(item.unitPriceHalalas)} each
                      </p>
                      {!item.isAvailable ? (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                          <AlertCircle aria-hidden="true" className="size-4" />
                          Quantity unavailable
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <p className="text-lg font-black text-zinc-950">
                        {formatSar(item.lineSubtotalHalalas)}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 items-center rounded-full border border-zinc-200">
                          <QuantityButton
                            label={`Decrease ${item.title} quantity`}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            <Minus aria-hidden="true" className="size-4" />
                          </QuantityButton>
                          <span className="w-9 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <QuantityButton
                            label={`Increase ${item.title} quantity`}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            <Plus aria-hidden="true" className="size-4" />
                          </QuantityButton>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.title}`}
                          onClick={() => removeItem(item.productId)}
                          className="inline-flex size-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="premium-panel h-fit rounded-2xl p-5 sm:p-6 lg:sticky lg:top-32">
            <p className="editorial-kicker">
              COD order
            </p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">
              Cart summary
            </h2>
            {summary?.issues.length ? (
              <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                {summary.issues[0].message}
              </div>
            ) : null}
            <div className="mt-6 space-y-3 border-t border-zinc-200 pt-5 text-sm font-semibold">
              <SummaryRow
                label="Subtotal"
                value={formatSar(summary?.estimatedSubtotalHalalas ?? 0)}
              />
              <SummaryRow
                label="Estimated VAT"
                value={formatSar(estimatedVatHalalas)}
              />
              <SummaryRow label="Delivery" value={formatSar(0)} />
              <SummaryRow
                label="Estimated total"
                value={formatSar(estimatedTotalHalalas)}
                strong
              />
            </div>
            <Link
              href="/checkout"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Continue to checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-bold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
            >
              Keep shopping
            </Link>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function QuantityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
    >
      {children}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "text-zinc-950" : "text-zinc-600"}>
        {label}
      </span>
      <span className={strong ? "text-lg font-black text-zinc-950" : "text-zinc-950"}>
        {value}
      </span>
    </div>
  );
}
