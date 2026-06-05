import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type AdminOrderStatus = Enums<"order_status">;

export type AdminOrderSummary = {
  id: string;
  publicOrderId: string;
  status: AdminOrderStatus;
  customerName: string;
  customerPhone: string;
  cityRegion: string;
  totalHalalas: number;
  createdAt: string;
};

export type AdminOrderItem = {
  id: string;
  productTitle: string;
  productSku: string;
  quantity: number;
  unitPriceHalalas: number;
  lineSubtotalHalalas: number;
};

export type AdminOrderDetail = AdminOrderSummary & {
  deliveryAddress: string;
  notes?: string;
  subtotalHalalas: number;
  vatHalalas: number;
  shippingHalalas: number;
  deliveredAt?: string;
  cancelledAt?: string;
  items: AdminOrderItem[];
};

export type AdminOrderListOptions = {
  status?: AdminOrderStatus;
  page?: number;
  limit?: number;
};

export type AdminOrderList = {
  items: AdminOrderSummary[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

const DEFAULT_LIMIT = 20;

type OrderRow = {
  id: string;
  public_order_id: string;
  status: AdminOrderStatus;
  customer_name: string;
  customer_phone: string;
  city_region: string;
  total_halalas: number;
  created_at: string;
};

type OrderDetailRow = OrderRow & {
  delivery_address: string;
  notes: string | null;
  subtotal_halalas: number;
  vat_halalas: number;
  shipping_halalas: number;
  delivered_at: string | null;
  cancelled_at: string | null;
  order_items: {
    id: string;
    product_title_en: string;
    product_sku: string;
    quantity: number;
    unit_price_halalas: number;
    line_subtotal_halalas: number;
  }[];
};

export async function listAdminOrders(
  options: AdminOrderListOptions = {},
): Promise<AdminOrderList> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const page = Math.max(options.page ?? 1, 1);
  const offset = (page - 1) * limit;
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("orders")
    .select(
      "id, public_order_id, status, customer_name, customer_phone, city_region, total_halalas, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to load admin orders: ${error.message}`);
  }

  const items = ((data ?? []) as OrderRow[]).map(mapOrderSummary);
  const total = count ?? items.length;

  return {
    items,
    total,
    page,
    limit,
    hasNextPage: offset + items.length < total,
  };
}

export async function getAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      public_order_id,
      status,
      customer_name,
      customer_phone,
      city_region,
      delivery_address,
      notes,
      subtotal_halalas,
      vat_halalas,
      shipping_halalas,
      total_halalas,
      delivered_at,
      cancelled_at,
      created_at,
      order_items(
        id,
        product_title_en,
        product_sku,
        quantity,
        unit_price_halalas,
        line_subtotal_halalas
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as OrderDetailRow;

  return {
    ...mapOrderSummary(row),
    deliveryAddress: row.delivery_address,
    notes: row.notes ?? undefined,
    subtotalHalalas: row.subtotal_halalas,
    vatHalalas: row.vat_halalas,
    shippingHalalas: row.shipping_halalas,
    deliveredAt: row.delivered_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    items: row.order_items.map((item) => ({
      id: item.id,
      productTitle: item.product_title_en,
      productSku: item.product_sku,
      quantity: item.quantity,
      unitPriceHalalas: item.unit_price_halalas,
      lineSubtotalHalalas: item.line_subtotal_halalas,
    })),
  };
}

export async function transitionAdminOrderStatus(
  orderId: string,
  nextStatus: AdminOrderStatus,
) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc("transition_cod_order_status", {
    order_id_input: orderId,
    next_status: nextStatus,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function mapOrderSummary(row: OrderRow): AdminOrderSummary {
  return {
    id: row.id,
    publicOrderId: row.public_order_id,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    cityRegion: row.city_region,
    totalHalalas: row.total_halalas,
    createdAt: row.created_at,
  };
}
