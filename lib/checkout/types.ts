import type { CartItemInput } from "@/lib/cart/types";

export type CheckoutInput = {
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  cityRegion: string;
  notes?: string;
  items: CartItemInput[];
};

export type CheckoutValidationResult =
  | {
      success: true;
      data: CheckoutInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

export type PlaceOrderResult = {
  orderId: string;
  publicOrderId: string;
  status: "created" | "already_created";
  totals?: {
    subtotalHalalas: number;
    vatHalalas: number;
    shippingHalalas: number;
    totalHalalas: number;
  };
};
