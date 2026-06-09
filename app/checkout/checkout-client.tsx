"use client";

import { AlertCircle, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CartSummary } from "@/lib/cart/types";
import { formatSar } from "@/lib/money";
import { calculateOrderTotalHalalas, calculateVatHalalas } from "@/lib/pricing";

type CheckoutResponse = {
  order?: {
    publicOrderId: string;
    totals?: {
      subtotalHalalas: number;
      vatHalalas: number;
      shippingHalalas: number;
      totalHalalas: number;
    };
  };
  errors?: Record<string, string>;
};

type CheckoutClientProps = {
  savedAddresses?: SavedCheckoutAddress[];
  defaultValues?: {
    customerName?: string;
    customerPhone?: string;
    cityRegion?: string;
    deliveryAddress?: string;
  };
};

type SavedCheckoutAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  cityRegion: string;
  deliveryAddress: string;
  isDefault: boolean;
};

type CheckoutFormValues = {
  customerName: string;
  customerPhone: string;
  cityRegion: string;
  deliveryAddress: string;
};

export function CheckoutClient({
  defaultValues,
  savedAddresses = [],
}: CheckoutClientProps) {
  const {
    items,
    clearCart,
    isServerCart,
    isLoaded: isCartLoaded,
    summary: serverSummary,
  } = useCart();
  const initialAddress =
    savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0];
  const cartKey = JSON.stringify(items);
  const [summaryState, setSummaryState] = useState<{
    key: string;
    summary: CartSummary | null;
  }>({ key: "", summary: null });
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddress?.id ?? "",
  );
  const [formValues, setFormValues] = useState<CheckoutFormValues>(() => ({
    customerName:
      initialAddress?.recipientName ?? defaultValues?.customerName ?? "",
    customerPhone: initialAddress?.phone ?? defaultValues?.customerPhone ?? "",
    cityRegion: initialAddress?.cityRegion ?? defaultValues?.cityRegion ?? "",
    deliveryAddress:
      initialAddress?.deliveryAddress ?? defaultValues?.deliveryAddress ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(createIdempotencyKey);
  const summary = isServerCart
    ? serverSummary
    : summaryState.key === cartKey
      ? summaryState.summary
      : null;
  const isSummaryLoading =
    !isCartLoaded ||
    (items.length > 0 &&
      (isServerCart ? !serverSummary : summaryState.key !== cartKey));
  const canSubmit =
    items.length > 0 &&
    (summary?.issues.length ?? 1) === 0 &&
    !isSubmitting;

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

  const estimatedVatHalalas = useMemo(
    () => calculateVatHalalas(summary?.estimatedSubtotalHalalas ?? 0),
    [summary?.estimatedSubtotalHalalas],
  );
  const estimatedTotalHalalas = calculateOrderTotalHalalas({
    subtotalHalalas: summary?.estimatedSubtotalHalalas ?? 0,
    vatHalalas: estimatedVatHalalas,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey,
          customerName: formData.get("customerName"),
          customerPhone: formData.get("customerPhone"),
          deliveryAddress: formData.get("deliveryAddress"),
          cityRegion: formData.get("cityRegion"),
          notes: formData.get("notes"),
          items,
        }),
      });
      const payload = (await response.json()) as CheckoutResponse;

      if (!response.ok || !payload.order) {
        setErrors(payload.errors ?? { order: "Unable to place order." });
        return;
      }

      window.sessionStorage.setItem(
        `saha-order-${payload.order.publicOrderId}`,
        JSON.stringify(payload.order),
      );
      if (!isServerCart) {
        clearCart();
      }
      window.location.replace(
        `/order-confirmation?order=${encodeURIComponent(
          payload.order.publicOrderId,
        )}`,
      );
    } catch {
      setErrors({ order: "Unable to place order. Try again shortly." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isCartLoaded) {
    return (
      <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <Loader2
          aria-hidden="true"
          className="mx-auto size-10 animate-spin text-emerald-700"
        />
        <h2 className="mt-4 text-2xl font-black text-zinc-950">
          Loading your cart
        </h2>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <ShoppingBag aria-hidden="true" className="mx-auto size-10 text-zinc-300" />
        <h2 className="mt-4 text-2xl font-black text-zinc-950">
          Your cart is empty
        </h2>
        <p className="mt-2 text-zinc-600">
          Add items before placing a cash on delivery order.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.82fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6"
      >
        <h2 className="text-2xl font-black text-zinc-950">Delivery details</h2>
        <div className="mt-6 grid gap-5">
          {savedAddresses.length > 1 ? (
            <label className="grid gap-2">
              <span className="text-sm font-bold text-zinc-950">
                Saved address
              </span>
              <select
                value={selectedAddressId}
                onChange={(event) => {
                  const nextAddress = savedAddresses.find(
                    (address) => address.id === event.target.value,
                  );

                  setSelectedAddressId(event.target.value);

                  if (nextAddress) {
                    setFormValues({
                      customerName: nextAddress.recipientName,
                      customerPhone: nextAddress.phone,
                      cityRegion: nextAddress.cityRegion,
                      deliveryAddress: nextAddress.deliveryAddress,
                    });
                  }
                }}
                className="h-12 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
              >
                <option value="">Custom delivery details</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}
                    {address.isDefault ? " (Default)" : ""} - {address.cityRegion}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Field
            label="Customer name"
            name="customerName"
            value={formValues.customerName}
            onChange={(event) => {
              setSelectedAddressId("");
              setFormValues((current) => ({
                ...current,
                customerName: event.target.value,
              }));
            }}
            error={errors.customerName}
            autoComplete="name"
            required
          />
          <Field
            label="Saudi phone number"
            name="customerPhone"
            value={formValues.customerPhone}
            onChange={(event) => {
              setSelectedAddressId("");
              setFormValues((current) => ({
                ...current,
                customerPhone: event.target.value,
              }));
            }}
            error={errors.customerPhone}
            autoComplete="tel"
            inputMode="tel"
            placeholder="05XXXXXXXX"
            required
          />
          <Field
            label="City or region"
            name="cityRegion"
            value={formValues.cityRegion}
            onChange={(event) => {
              setSelectedAddressId("");
              setFormValues((current) => ({
                ...current,
                cityRegion: event.target.value,
              }));
            }}
            error={errors.cityRegion}
            autoComplete="address-level2"
            required
          />
          <label className="grid gap-2">
            <span className="text-sm font-bold text-zinc-950">
              Delivery address
            </span>
            <textarea
              name="deliveryAddress"
              value={formValues.deliveryAddress}
              onChange={(event) => {
                setSelectedAddressId("");
                setFormValues((current) => ({
                  ...current,
                  deliveryAddress: event.target.value,
                }));
              }}
              required
              rows={4}
              autoComplete="street-address"
              className="resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
            />
            {errors.deliveryAddress ? (
              <ErrorText>{errors.deliveryAddress}</ErrorText>
            ) : null}
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-zinc-950">
              Order notes
            </span>
            <textarea
              name="notes"
              rows={3}
              className="resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
            />
          </label>
        </div>

        {errors.items || errors.order ? (
          <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {errors.items ?? errors.order}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="size-4" />
          )}
          Place COD order
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-2xl font-black text-zinc-950">Order summary</h2>
        {isSummaryLoading ? (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="h-20 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : null}

        {summary ? (
          <>
            <div className="mt-6 space-y-5">
              {summary.items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="relative size-20 overflow-hidden rounded-lg bg-zinc-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-zinc-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-zinc-600">
                      Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-sm font-black text-zinc-950">
                      {formatSar(item.lineSubtotalHalalas)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {summary.issues.length > 0 ? (
              <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                <AlertCircle aria-hidden="true" className="mb-2 size-5" />
                {summary.issues[0].message}
              </div>
            ) : null}

            <div className="mt-6 space-y-3 border-t border-zinc-200 pt-5 text-sm font-semibold">
              <SummaryRow
                label="Subtotal"
                value={formatSar(summary.estimatedSubtotalHalalas)}
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
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Final total is recalculated server-side when the COD order is
              created.
            </p>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-950">{label}</span>
      <input
        name={name}
        className="h-12 rounded-full border border-zinc-200 px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700"
        {...props}
      />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-rose-600">{children}</span>;
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

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
