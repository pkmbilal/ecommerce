export const SAUDI_VAT_RATE_BPS = 1500;

export function calculateVatHalalas(
  subtotalHalalas: number,
  vatRateBps = SAUDI_VAT_RATE_BPS,
) {
  assertIntegerMoney(subtotalHalalas, "subtotalHalalas");

  if (!Number.isInteger(vatRateBps) || vatRateBps < 0 || vatRateBps > 10000) {
    throw new Error("vatRateBps must be an integer between 0 and 10000.");
  }

  return Math.round((subtotalHalalas * vatRateBps) / 10000);
}

export function calculateOrderTotalHalalas({
  subtotalHalalas,
  vatHalalas,
  shippingHalalas = 0,
}: {
  subtotalHalalas: number;
  vatHalalas: number;
  shippingHalalas?: number;
}) {
  assertIntegerMoney(subtotalHalalas, "subtotalHalalas");
  assertIntegerMoney(vatHalalas, "vatHalalas");
  assertIntegerMoney(shippingHalalas, "shippingHalalas");

  return subtotalHalalas + vatHalalas + shippingHalalas;
}

function assertIntegerMoney(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
}
