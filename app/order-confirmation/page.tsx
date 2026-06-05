import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/storefront/site-header";

export const metadata: Metadata = {
  title: "Order Confirmation | SAHA",
  description: "Your cash on delivery order has been created.",
};

type OrderConfirmationPageProps = {
  searchParams: Promise<{
    order?: string | string[];
  }>;
};

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const params = await searchParams;
  const publicOrderId = Array.isArray(params.order)
    ? params.order[0]
    : params.order;

  return (
    <>
      <SiteHeader />
      <main className="bg-[#fbfaf7]">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <CheckCircle2
              aria-hidden="true"
              className="mx-auto size-12 text-emerald-700"
            />
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-emerald-800">
              COD order created
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
              Thank you for your order.
            </h1>
            {publicOrderId ? (
              <p className="mt-4 text-lg font-bold text-zinc-950">
                Order {publicOrderId}
              </p>
            ) : null}
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-zinc-600">
              Your order is pending confirmation. A store admin will confirm the
              cash on delivery order before dispatch.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white"
              >
                Continue shopping
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-bold text-zinc-950"
              >
                Back home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
