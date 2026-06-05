import type { Metadata } from "next";

import { SiteHeader } from "@/components/storefront/site-header";

import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout | SAHA",
  description:
    "Place a cash on delivery order with Saudi delivery details and server-validated totals.",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#fbfaf7]">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
            Cash on delivery
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            Checkout
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-700">
            Enter Saudi delivery details. Final totals and inventory are
            recalculated on the server before your COD order is created.
          </p>
          <CheckoutClient />
        </section>
      </main>
    </>
  );
}
