import type { Metadata } from "next";
import Link from "next/link";

import { formatSar } from "@/lib/money";
import {
  type AdminOrderStatus,
  listAdminOrders,
} from "@/lib/admin/orders";

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
  const status = parseStatus(getSingleParam(params.status));
  const page = parsePage(getSingleParam(params.page));
  const orders = await listAdminOrders({ status, page });

  return (
    <AdminShell title="Orders" subtitle="Manage cash on delivery orders.">
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

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 max-md:hidden">
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
              className="grid gap-3 border-b border-zinc-100 px-4 py-4 transition hover:bg-emerald-50 md:grid-cols-[1fr_1fr_1fr_0.8fr] md:items-center"
            >
              <div>
                <p className="font-black text-zinc-950">{order.publicOrderId}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {new Date(order.createdAt).toLocaleString("en-SA")}
                </p>
              </div>
              <div>
                <p className="font-bold text-zinc-950">{order.customerName}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {order.customerPhone} - {order.cityRegion}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <p className="font-black text-zinc-950 md:text-right">
                {formatSar(order.totalHalalas)}
              </p>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-black text-zinc-950">No orders found</h2>
            <p className="mt-2 text-zinc-600">Orders will appear here after checkout.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {orders.page > 1 ? (
          <Link
            href={buildPageHref(status, orders.page - 1)}
            className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-bold text-zinc-950"
          >
            Previous
          </Link>
        ) : null}
        {orders.hasNextPage ? (
          <Link
            href={buildPageHref(status, orders.page + 1)}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white"
          >
            Next page
          </Link>
        ) : null}
      </div>
    </AdminShell>
  );
}

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/admin/orders" className="text-2xl font-black text-zinc-950">
            SAHA Admin
          </Link>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:border-zinc-950"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
          Order management
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-700">
      {formatStatus(status)}
    </span>
  );
}

export function formatStatus(status: AdminOrderStatus) {
  return status.replaceAll("_", " ");
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
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
        isActive
          ? "bg-zinc-950 text-white"
          : "border border-zinc-200 bg-white text-zinc-700"
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
