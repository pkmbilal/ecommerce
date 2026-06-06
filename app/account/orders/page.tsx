import type { Metadata } from "next";
import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel, AdminStatusBadge } from "@/components/admin/tailadmin/primitives";
import { requireCustomerSession } from "@/lib/admin/auth";
import { formatStatus, getStatusTone } from "@/lib/admin/status";
import { getCustomerProfile } from "@/lib/customer/account";
import { listCustomerOrders } from "@/lib/customer/orders";
import { formatSar } from "@/lib/money";

export const metadata: Metadata = {
  title: "Orders | SAHA Account",
};

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const [session, params] = await Promise.all([
    requireCustomerSession(),
    searchParams,
  ]);
  const page = parsePage(getSingleParam(params.page));
  const [profile, orders] = await Promise.all([
    getCustomerProfile(session.userId),
    listCustomerOrders({ userId: session.userId, page }),
  ]);

  return (
    <AccountShell
      profile={profile}
      title="Orders"
      subtitle="Track cash on delivery orders placed while signed in."
    >
      <AdminPanel title="Order history" description="Guest orders are not linked here.">
        {orders.items.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {orders.items.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="grid gap-4 px-5 py-4 transition hover:bg-gray-50 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {order.publicOrderId}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.cityRegion} · {new Date(order.createdAt).toLocaleDateString("en-SA")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:justify-end">
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
          <div className="p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No linked orders yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Place a COD order while signed in and it will appear here.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse products
            </Link>
          </div>
        )}
      </AdminPanel>

      <div className="mt-6 flex items-center justify-end gap-3">
        {orders.page > 1 ? (
          <Link
            href={buildPageHref(orders.page - 1)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Previous
          </Link>
        ) : null}
        {orders.hasNextPage ? (
          <Link
            href={buildPageHref(orders.page + 1)}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </AccountShell>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildPageHref(page: number) {
  return page > 1 ? `/account/orders?page=${page}` : "/account/orders";
}
