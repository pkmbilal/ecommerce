export type ProductReview = {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  authorName: string;
  createdAt: string;
};

export type CustomerReviewState = {
  canReview: boolean;
  existingReview?: ProductReview;
};

export type ProductReviewSectionData = {
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  customerState: CustomerReviewState;
};
