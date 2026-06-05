export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CartSummaryItem = {
  productId: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  unitPriceHalalas: number;
  quantity: number;
  lineSubtotalHalalas: number;
  availableQuantity?: number;
  isAvailable: boolean;
};

export type CartSummaryIssue = {
  productId: string;
  message: string;
};

export type CartSummary = {
  items: CartSummaryItem[];
  estimatedSubtotalHalalas: number;
  issues: CartSummaryIssue[];
};
