export const STANDARD_DELIVERY_FEE_HALALAS = 2500;
export const FREE_DELIVERY_THRESHOLD_HALALAS = 25000;

export function calculateDeliveryFeeHalalas(subtotalHalalas: number) {
  if (!Number.isInteger(subtotalHalalas) || subtotalHalalas < 0) {
    throw new Error("subtotalHalalas must be a non-negative integer.");
  }

  if (subtotalHalalas === 0 || subtotalHalalas >= FREE_DELIVERY_THRESHOLD_HALALAS) {
    return 0;
  }

  return STANDARD_DELIVERY_FEE_HALALAS;
}
