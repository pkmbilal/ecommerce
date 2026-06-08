import type { Metadata } from "next";

import { SiteHeader } from "@/components/storefront/site-header";
import { getCurrentProfile } from "@/lib/admin/auth";
import { getCustomerProfile, listCustomerAddresses } from "@/lib/customer/account";

import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout | SAHA",
  description:
    "Place a cash on delivery order with Saudi delivery details and server-validated totals.",
};

export default async function CheckoutPage() {
  const session = await getCurrentProfile();
  const accountData = session
    ? await Promise.all([
        getCustomerProfile(session.userId),
        listCustomerAddresses(session.userId),
      ])
    : null;
  const profile = accountData?.[0];
  const addresses = accountData?.[1] ?? [];
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

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
          <CheckoutClient
            savedAddresses={addresses.map((address) => ({
              id: address.id,
              label: address.label,
              recipientName: address.recipientName,
              phone: address.phone,
              cityRegion: address.cityRegion,
              deliveryAddress: address.deliveryAddress,
              isDefault: address.isDefault,
            }))}
            defaultValues={{
              customerName:
                defaultAddress?.recipientName ?? profile?.fullName ?? "",
              customerPhone: defaultAddress?.phone ?? profile?.phone ?? "",
              cityRegion: defaultAddress?.cityRegion ?? "",
              deliveryAddress: defaultAddress?.deliveryAddress ?? "",
            }}
          />
        </section>
      </main>
    </>
  );
}
