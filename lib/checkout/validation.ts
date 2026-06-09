import type { CartItemInput } from "@/lib/cart/types";

import type { CheckoutValidationResult } from "./types";

const SAUDI_PHONE_PATTERN = /^(\+966|966|0)?5[0-9]{8}$/;

type RawCheckoutInput = {
  idempotencyKey?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  deliveryAddress?: unknown;
  cityRegion?: unknown;
  notes?: unknown;
  items?: unknown;
};

export function validateCheckoutInput(
  rawInput: RawCheckoutInput,
  options: { requireItems?: boolean } = {},
): CheckoutValidationResult {
  const errors: Record<string, string> = {};
  const idempotencyKey = asTrimmedString(rawInput.idempotencyKey);
  const customerName = asTrimmedString(rawInput.customerName);
  const customerPhone = asTrimmedString(rawInput.customerPhone);
  const deliveryAddress = asTrimmedString(rawInput.deliveryAddress);
  const cityRegion = asTrimmedString(rawInput.cityRegion);
  const notes = asTrimmedString(rawInput.notes);
  const items = normalizeItems(rawInput.items);

  if (!idempotencyKey || idempotencyKey.length < 16) {
    errors.idempotencyKey = "Refresh the page and try placing the order again.";
  }

  if (!customerName || customerName.length < 2) {
    errors.customerName = "Enter the customer name.";
  }

  if (!customerPhone || !SAUDI_PHONE_PATTERN.test(customerPhone)) {
    errors.customerPhone = "Enter a valid Saudi mobile number.";
  }

  if (!deliveryAddress || deliveryAddress.length < 8) {
    errors.deliveryAddress = "Enter a complete delivery address.";
  }

  if (!cityRegion || cityRegion.length < 2) {
    errors.cityRegion = "Enter the delivery city or region.";
  }

  if ((options.requireItems ?? true) && items.length === 0) {
    errors.items = "Your cart is empty.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      idempotencyKey: idempotencyKey as string,
      customerName: customerName as string,
      customerPhone: customerPhone as string,
      deliveryAddress: deliveryAddress as string,
      cityRegion: cityRegion as string,
      notes: notes || undefined,
      items,
    },
  };
}

function normalizeItems(rawItems: unknown): CartItemInput[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const quantitiesByProductId = new Map<string, number>();

  for (const rawItem of rawItems.slice(0, 20)) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const productId = asTrimmedString(
      (rawItem as { productId?: unknown }).productId,
    );
    const quantity = (rawItem as { quantity?: unknown }).quantity;

    if (
      !productId ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }

    quantitiesByProductId.set(
      productId,
      Math.min((quantitiesByProductId.get(productId) ?? 0) + quantity, 99),
    );
  }

  return Array.from(quantitiesByProductId, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}
