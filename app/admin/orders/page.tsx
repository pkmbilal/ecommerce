import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import { requireAdminSession } from "@/lib/admin/auth";
import { formatSar } from "@/lib/money";
import {
  type AdminOrderStatus,
  listAdminOrders,
} from "@/lib/admin/orders";
import { formatStatus, getStatusTone } from "@/lib/admin/status";

export const metadata: Metadata = {
  title: "Admin Orders | SAHA",
};

type AdminOrdersPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    page?: string | string[];
  }>;
};

const orderStatuses: AdminOrderStatus[] = [
  "pending_confirmation",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const profile = await requireAdminSession();
  const status = parseStatus(getSingleParam(params.status));
  const page = parsePage(getSingleParam(params.page));
  const orders = await listAdminOrders({ status, page });

  return (
    <TailAdminShell
      profile={profile}
      title="Orders"
      subtitle="Manage cash on delivery orders."
    >
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterLink href="/admin/orders" isActive={!status}>
          All
        </FilterLink>
        {orderStatuses.map((item) => (
          <FilterLink
            key={item}
            href={`/admin/orders?status=${item}`}
            isActive={status === item}
          >
            {formatStatus(item)}
          </FilterLink>
        ))}
      </div>

      <AdminPanel className="mt-6">
        <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-medium uppercase text-gray-500 max-md:hidden">
          <span>Order</span>
          <span>Customer</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>
        {orders.items.length > 0 ? (
          orders.items.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="grid gap-3 border-b border-gray-100 px-5 py-4 transition hover:bg-gray-50 md:grid-cols-[1fr_1fr_1fr_0.8fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-gray-900">{order.publicOrderId}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("en-SA")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {order.customerPhone} - {order.cityRegion}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <p className="font-semibold text-gray-900 md:text-right">
                {formatSar(order.totalHalalas)}
              </p>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No orders found</h2>
            <p className="mt-2 text-gray-500">Orders will appear here after checkout.</p>
          </div>
        )}
      </AdminPanel>

      <div className="mt-8 flex justify-center gap-3">
        {orders.page > 1 ? (
          <Link
            href={buildPageHref(status, orders.page - 1)}
            className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900"
          >
            Previous
          </Link>
        ) : null}
        {orders.hasNextPage ? (
          <Link
            href={buildPageHref(status, orders.page + 1)}
            className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </TailAdminShell>
  );
}

export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <AdminStatusBadge tone={getStatusTone(status)}>
      {formatStatus(status)}
    </AdminStatusBadge>
  );
}

function FilterLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${
        isActive
          ? "bg-brand-500 text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): AdminOrderStatus | undefined {
  return orderStatuses.includes(value as AdminOrderStatus)
    ? (value as AdminOrderStatus)
    : undefined;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildPageHref(status: AdminOrderStatus | undefined, page: number) {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}
