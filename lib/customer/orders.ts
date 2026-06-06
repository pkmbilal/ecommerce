import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export type CustomerOrderStatus = Enums<"order_status">;

export type CustomerOrderSummary = {
  id: string;
  publicOrderId: string;
  status: CustomerOrderStatus;
  cityRegion: string;
  totalHalalas: number;
  createdAt: string;
};

export type CustomerOrderItem = {
  id: string;
  productTitle: string;
  productSlug: string;
  productSku: string;
  quantity: number;
  unitPriceHalalas: number;
  lineSubtotalHalalas: number;
};

export type CustomerOrderDetail = CustomerOrderSummary & {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  subtotalHalalas: number;
  vatHalalas: number;
  shippingHalalas: number;
  deliveredAt?: string;
  cancelledAt?: string;
  items: CustomerOrderItem[];
};

export type CustomerOrderList = {
  items: CustomerOrderSummary[];
  page: number;
  limit: number;
  hasNextPage: boolean;
};

const DEFAULT_LIMIT = 10;

type OrderRow = {
  id: string;
  public_order_id: string;
  status: CustomerOrderStatus;
  city_region: string;
  total_halalas: number;
  created_at: string;
};

type OrderDetailRow = OrderRow & {
  customer_name: string;
  customer_phone: string;
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
    product_slug: string;
    product_sku: string;
    quantity: number;
    unit_price_halalas: number;
    line_subtotal_halalas: number;
  }[];
};

export async function listCustomerOrders({
  userId,
  page = 1,
  limit = DEFAULT_LIMIT,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<CustomerOrderList> {
  const normalizedPage = Math.max(page, 1);
  const offset = (normalizedPage - 1) * limit;
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, public_order_id, status, city_region, total_halalas, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    if (isMissingCustomerOrderSchemaError(error.message)) {
      return {
        items: [],
        page: normalizedPage,
        limit,
        hasNextPage: false,
      };
    }

    throw new Error(`Failed to load customer orders: ${error.message}`);
  }

  const rows = (data ?? []) as OrderRow[];
  const visibleRows = rows.slice(0, limit);

  return {
    items: visibleRows.map(mapOrderSummary),
    page: normalizedPage,
    limit,
    hasNextPage: rows.length > limit,
  };
}

export async function getCustomerOrderDetail({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}): Promise<CustomerOrderDetail | null> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      public_order_id,
      status,
      city_region,
      customer_name,
      customer_phone,
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
        product_slug,
        product_sku,
        quantity,
        unit_price_halalas,
        line_subtotal_halalas
      )
    `,
    )
    .eq("id", orderId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingCustomerOrderSchemaError(error.message)) {
      return null;
    }

    throw new Error(`Failed to load customer order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as OrderDetailRow;

  return {
    ...mapOrderSummary(row),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
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
      productSlug: item.product_slug,
      productSku: item.product_sku,
      quantity: item.quantity,
      unitPriceHalalas: item.unit_price_halalas,
      lineSubtotalHalalas: item.line_subtotal_halalas,
    })),
  };
}

function mapOrderSummary(row: OrderRow): CustomerOrderSummary {
  return {
    id: row.id,
    publicOrderId: row.public_order_id,
    status: row.status,
    cityRegion: row.city_region,
    totalHalalas: row.total_halalas,
    createdAt: row.created_at,
  };
}

function isMissingCustomerOrderSchemaError(message: string) {
  return message.includes("orders.profile_id") && message.includes("does not exist");
}
