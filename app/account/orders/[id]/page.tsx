import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { AdminPanel, AdminStatusBadge } from "@/components/admin/tailadmin/primitives";
import { requireCustomerDashboardSession } from "@/lib/admin/auth";
import { formatStatus, getStatusTone } from "@/lib/admin/status";
import { getCustomerProfile } from "@/lib/customer/account";
import { getCustomerOrderDetail } from "@/lib/customer/orders";
import { formatSar } from "@/lib/money";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Order Detail | SAHA Account",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [session, { id }] = await Promise.all([
    requireCustomerDashboardSession(),
    params,
  ]);
  const [profile, order] = await Promise.all([
    getCustomerProfile(session.userId),
    getCustomerOrderDetail({ userId: session.userId, orderId: id }),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <AccountShell
      profile={profile}
      title={order.publicOrderId}
      subtitle="Cash on delivery order details."
      actions={
        <Link
          href="/account/orders"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="size-4" />
          Back to orders
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Order summary">
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AdminStatusBadge tone={getStatusTone(order.status)}>
                {formatStatus(order.status)}
              </AdminStatusBadge>
              <p className="text-sm font-semibold text-gray-500">
                {new Date(order.createdAt).toLocaleString("en-SA")}
              </p>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Detail label="Recipient" value={order.customerName} />
              <Detail label="Phone" value={order.customerPhone} />
              <Detail label="City or region" value={order.cityRegion} />
              <Detail label="Address" value={order.deliveryAddress} />
              {order.notes ? <Detail label="Notes" value={order.notes} /> : null}
            </dl>
          </div>
        </AdminPanel>

        <AdminPanel title="Totals" description="SAR totals from server-side order creation.">
          <dl className="grid gap-3 p-5 text-sm">
            <SummaryRow label="Subtotal" value={formatSar(order.subtotalHalalas)} />
            <SummaryRow label="VAT" value={formatSar(order.vatHalalas)} />
            <SummaryRow label="Delivery" value={formatSar(order.shippingHalalas)} />
            <SummaryRow label="Total" value={formatSar(order.totalHalalas)} strong />
          </dl>
        </AdminPanel>
      </div>

      <AdminPanel title="Items" className="mt-6 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]">
              <div>
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-semibold text-gray-900 hover:text-emerald-700"
                >
                  {item.productTitle}
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  SKU {item.productSku} · Qty {item.quantity}
                </p>
              </div>
              <div className="text-sm font-semibold text-gray-900 sm:text-right">
                <p>{formatSar(item.lineSubtotalHalalas)}</p>
                <p className="mt-1 text-gray-500">
                  {formatSar(item.unitPriceHalalas)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
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
      <dt className={strong ? "font-semibold text-gray-900" : "text-gray-500"}>
        {label}
      </dt>
      <dd className={strong ? "text-lg font-bold text-gray-900" : "font-semibold text-gray-900"}>
        {value}
      </dd>
    </div>
  );
}
