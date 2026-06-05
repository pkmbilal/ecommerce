import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

import type { CheckoutInput, PlaceOrderResult } from "./types";

type PlaceCodOrderResponse = {
  orderId?: unknown;
  publicOrderId?: unknown;
  status?: unknown;
  totals?: unknown;
};

export async function placeCodOrder(
  input: CheckoutInput,
): Promise<PlaceOrderResult> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("place_cod_order", {
    payload: {
      idempotency_key: input.idempotencyKey,
      customer: {
        name: input.customerName,
        phone: input.customerPhone,
      },
      delivery: {
        address: input.deliveryAddress,
        city_region: input.cityRegion,
      },
      notes: input.notes ?? null,
      items: input.items,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return parsePlaceOrderResponse(data as PlaceCodOrderResponse);
}

function parsePlaceOrderResponse(
  response: PlaceCodOrderResponse,
): PlaceOrderResult {
  if (
    typeof response.orderId !== "string" ||
    typeof response.publicOrderId !== "string" ||
    (response.status !== "created" && response.status !== "already_created")
  ) {
    throw new Error("Unexpected order placement response.");
  }

  return {
    orderId: response.orderId,
    publicOrderId: response.publicOrderId,
    status: response.status,
    totals: parseTotals(response.totals),
  };
}

function parseTotals(value: unknown): PlaceOrderResult["totals"] {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const totals = value as Record<string, unknown>;

  if (
    typeof totals.subtotalHalalas !== "number" ||
    typeof totals.vatHalalas !== "number" ||
    typeof totals.shippingHalalas !== "number" ||
    typeof totals.totalHalalas !== "number"
  ) {
    return undefined;
  }

  return {
    subtotalHalalas: totals.subtotalHalalas,
    vatHalalas: totals.vatHalalas,
    shippingHalalas: totals.shippingHalalas,
    totalHalalas: totals.totalHalalas,
  };
}
