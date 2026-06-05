import { notFound } from "next/navigation";

import {
  type AdminOrderStatus,
  getAdminOrderDetail,
} from "@/lib/admin/orders";
import { formatSar } from "@/lib/money";
import {
  AdminShell,
  formatStatus,
  StatusBadge,
} from "@/app/admin/orders/page";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const transitionsByStatus: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  const transitions = transitionsByStatus[order.status];

  return (
    <AdminShell
      title={order.publicOrderId}
      subtitle="Review delivery details, totals, and COD status."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-zinc-950">Order items</h2>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-5 divide-y divide-zinc-100">
            {order.items.map((item) => (
              <div key={item.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold text-zinc-950">{item.productTitle}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    SKU {item.productSku} - Qty {item.quantity}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-black text-zinc-950">
                    {formatSar(item.lineSubtotalHalalas)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatSar(item.unitPriceHalalas)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-zinc-200 pt-5 text-sm font-semibold">
            <SummaryRow label="Subtotal" value={formatSar(order.subtotalHalalas)} />
            <SummaryRow label="VAT" value={formatSar(order.vatHalalas)} />
            <SummaryRow label="Delivery" value={formatSar(order.shippingHalalas)} />
            <SummaryRow label="Total" value={formatSar(order.totalHalalas)} strong />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-black text-zinc-950">Customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Name" value={order.customerName} />
              <Detail label="Phone" value={order.customerPhone} />
              <Detail label="City/region" value={order.cityRegion} />
              <Detail label="Address" value={order.deliveryAddress} />
              {order.notes ? <Detail label="Notes" value={order.notes} /> : null}
            </dl>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xl font-black text-zinc-950">Status actions</h2>
            {transitions.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {transitions.map((status) => (
                  <form
                    key={status}
                    action={`/api/admin/orders/${order.id}/status`}
                    method="post"
                  >
                    <input type="hidden" name="nextStatus" value={status} />
                    <button
                      type="submit"
                      className={`h-11 w-full rounded-full px-4 text-sm font-bold ${
                        status === "cancelled"
                          ? "bg-rose-600 text-white"
                          : "bg-zinc-950 text-white"
                      }`}
                    >
                      Mark {formatStatus(status)}
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">
                This order is finalized and cannot be changed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold text-zinc-500">{label}</dt>
      <dd className="mt-1 font-semibold text-zinc-950">{value}</dd>
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
      <span className={strong ? "text-zinc-950" : "text-zinc-600"}>{label}</span>
      <span className={strong ? "text-lg font-black text-zinc-950" : "text-zinc-950"}>
        {value}
      </span>
    </div>
  );
}
