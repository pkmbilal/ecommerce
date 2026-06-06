import { Heart, MapPin, PackageCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import {
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { requireCustomerSession } from "@/lib/admin/auth";
import { formatStatus, getStatusTone } from "@/lib/admin/status";
import {
  getCustomerProfile,
  listCustomerAddresses,
  listCustomerFavorites,
} from "@/lib/customer/account";
import { listCustomerOrders } from "@/lib/customer/orders";
import { formatSar } from "@/lib/money";

export const metadata: Metadata = {
  title: "Account Dashboard | SAHA",
};

export default async function AccountPage() {
  const session = await requireCustomerSession();
  const [profile, addresses, favorites, orders] = await Promise.all([
    getCustomerProfile(session.userId),
    listCustomerAddresses(session.userId),
    listCustomerFavorites(session.userId),
    listCustomerOrders({ userId: session.userId, limit: 5 }),
  ]);
  const defaultAddress = addresses.find((address) => address.isDefault);

  return (
    <AccountShell
      profile={profile}
      title="Account dashboard"
      subtitle="Track COD orders, manage saved Saudi delivery details, and keep favorite products ready for your next checkout."
      actions={
        <Link
          href="/products"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Continue shopping
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Linked orders"
          value={String(orders.items.length)}
          note="Authenticated COD orders"
          icon={<PackageCheck className="size-6" />}
        />
        <AdminStatCard
          label="Saved addresses"
          value={String(addresses.length)}
          note={defaultAddress ? defaultAddress.cityRegion : "No default yet"}
          icon={<MapPin className="size-6" />}
        />
        <AdminStatCard
          label="Favorites"
          value={String(favorites.length)}
          note="Saved products"
          icon={<Heart className="size-6" />}
        />
        <AdminStatCard
          label="Profile"
          value={profile.phone ? "Ready" : "Needs phone"}
          note={profile.email}
          icon={<UserRound className="size-6" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          title="Recent orders"
          description="Future logged-in cash on delivery orders appear here."
          action={
            <Link href="/account/orders" className="text-sm font-semibold text-emerald-700">
              View all
            </Link>
          }
          className="overflow-hidden"
        >
          {orders.items.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {orders.items.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-gray-50 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.publicOrderId}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.cityRegion} · {new Date(order.createdAt).toLocaleDateString("en-SA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <AdminStatusBadge tone={getStatusTone(order.status)}>
                      {formatStatus(order.status)}
                    </AdminStatusBadge>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatSar(order.totalHalalas)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No linked orders yet"
              description="Sign in before checkout and your COD order history will appear here."
              href="/products"
              action="Browse products"
            />
          )}
        </AdminPanel>

        <AdminPanel title="Delivery snapshot" description="Your default checkout details.">
          {defaultAddress ? (
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {defaultAddress.label}
                </h2>
                <AdminStatusBadge tone="success">Default</AdminStatusBadge>
              </div>
              <dl className="mt-5 grid gap-4 text-sm">
                <Detail label="Recipient" value={defaultAddress.recipientName} />
                <Detail label="Phone" value={defaultAddress.phone} />
                <Detail label="City or region" value={defaultAddress.cityRegion} />
                <Detail label="Address" value={defaultAddress.deliveryAddress} />
              </dl>
              <Link
                href="/account/addresses"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage addresses
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Add your first address"
              description="Save a Saudi delivery address to speed up checkout."
              href="/account/addresses"
              action="Add address"
            />
          )}
        </AdminPanel>
      </div>
    </AccountShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
        {description}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        {action}
      </Link>
    </div>
  );
}
