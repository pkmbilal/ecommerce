import "server-only";

import { listAdminOrders, type AdminOrderSummary } from "@/lib/admin/orders";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export type AdminDashboardMetrics = {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  activeProducts: number;
};

export type InventoryAttentionItem = {
  productId: string;
  title: string;
  sku: string;
  stockOnHand: number;
  reservedQuantity: number;
  lowStockThreshold: number;
};

type ProductInventoryRow = {
  id: string;
  title_en: string;
  sku: string;
  inventory_items: {
    stock_on_hand: number;
    reserved_quantity: number;
    low_stock_threshold: number;
  } | null;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createSupabaseAuthServerClient();
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    activeProducts,
  ] = await Promise.all([
    getCount(supabase.from("orders").select("id", { count: "exact", head: true })),
    getCount(
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_confirmation"),
    ),
    getCount(
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "delivered"),
    ),
    getCount(
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ),
  ]);

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    activeProducts,
  };
}

export async function getRecentAdminOrders(
  limit = 6,
): Promise<AdminOrderSummary[]> {
  const orders = await listAdminOrders({ limit });

  return orders.items;
}

export async function getInventoryAttentionItems(
  limit = 6,
): Promise<InventoryAttentionItem[]> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title_en, sku, inventory_items(stock_on_hand, reserved_quantity, low_stock_threshold)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to load inventory attention items: ${error.message}`);
  }

  return ((data ?? []) as unknown as ProductInventoryRow[])
    .map((row) => ({
      productId: row.id,
      title: row.title_en,
      sku: row.sku,
      stockOnHand: row.inventory_items?.stock_on_hand ?? 0,
      reservedQuantity: row.inventory_items?.reserved_quantity ?? 0,
      lowStockThreshold: row.inventory_items?.low_stock_threshold ?? 0,
    }))
    .filter(
      (item) =>
        item.stockOnHand <= item.lowStockThreshold || item.reservedQuantity > 0,
    )
    .sort(
      (left, right) =>
        left.stockOnHand - left.lowStockThreshold -
        (right.stockOnHand - right.lowStockThreshold),
    )
    .slice(0, limit);
}

async function getCount(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
) {
  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to load admin dashboard count: ${error.message}`);
  }

  return count ?? 0;
}
