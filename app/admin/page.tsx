import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, PackageCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";

import {
  AdminPanel,
  AdminStatCard,
  AdminStatusBadge,
} from "@/components/admin/tailadmin/primitives";
import { TailAdminShell } from "@/components/admin/tailadmin/admin-shell";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  getAdminDashboardMetrics,
  getInventoryAttentionItems,
  getRecentAdminOrders,
} from "@/lib/admin/dashboard";
import { formatSar } from "@/lib/money";
import { formatStatus, getStatusTone } from "@/lib/admin/status";

export const metadata: Metadata = {
  title: "Admin Dashboard | SAHA",
};

export default async function AdminDashboardPage() {
  const profile = await requireAdminSession();
  const [metrics, recentOrders, inventoryItems] = await Promise.all([
    getAdminDashboardMetrics(),
    getRecentAdminOrders(),
    getInventoryAttentionItems(),
  ]);

  return (
    <TailAdminShell
      profile={profile}
      title="Dashboard"
      subtitle="COD order activity, catalog health, and inventory attention."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total orders"
          value={String(metrics.totalOrders)}
          note="All COD orders"
          icon={<ShoppingCart className="size-6" />}
        />
        <AdminStatCard
          label="Pending"
          value={String(metrics.pendingOrders)}
          note="Need confirmation"
          icon={<AlertTriangle className="size-6" />}
        />
        <AdminStatCard
          label="Delivered"
          value={String(metrics.deliveredOrders)}
          note="Collected COD revenue"
          icon={<CheckCircle2 className="size-6" />}
        />
        <AdminStatCard
          label="Active products"
          value={String(metrics.activeProducts)}
          note="Visible storefront items"
          icon={<PackageCheck className="size-6" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <AdminPanel
          title="Recent orders"
          description="Latest cash on delivery orders."
          action={
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-brand-500 hover:text-brand-700"
            >
              View all
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-medium uppercase text-gray-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-gray-900 hover:text-brand-500"
                      >
                        {order.publicOrderId}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-SA")}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.cityRegion}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge tone={getStatusTone(order.status)}>
                        {formatStatus(order.status)}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {formatSar(order.totalHalalas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Inventory attention"
          description="Low stock or reserved stock to monitor."
        >
          <div className="divide-y divide-gray-100">
            {inventoryItems.length > 0 ? (
              inventoryItems.map((item) => (
                <Link
                  key={item.productId}
                  href={`/admin/products/${item.productId}`}
                  className="block px-5 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">SKU {item.sku}</p>
                    </div>
                    <AdminStatusBadge
                      tone={
                        item.stockOnHand <= item.lowStockThreshold
                          ? "danger"
                          : "warning"
                      }
                    >
                      {item.stockOnHand} stock
                    </AdminStatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    {item.reservedQuantity} reserved, threshold{" "}
                    {item.lowStockThreshold}
                  </p>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                No active inventory attention items.
              </div>
            )}
          </div>
        </AdminPanel>
      </div>
    </TailAdminShell>
  );
}
