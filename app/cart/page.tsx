import type { Metadata } from "next";

import { SiteHeader } from "@/components/storefront/site-header";

import { CartPageClient } from "./cart-page-client";

export const metadata: Metadata = {
  title: "Cart | SAHA",
  description:
    "Review your SAHA cart before placing a cash on delivery order in Saudi Arabia.",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#fbfaf7]">
        <CartPageClient />
      </main>
    </>
  );
}
