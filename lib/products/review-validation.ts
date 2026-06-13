export type ProductReviewInput = {
  rating: number;
  title?: string;
  body?: string;
};

export type ProductReviewValidationResult =
  | {
      success: true;
      data: ProductReviewInput;
    }
  | {
      success: false;
      error: string;
    };

export function validateProductReviewForm(
  formData: FormData,
): ProductReviewValidationResult {
  const rating = Number(formData.get("rating"));
  const title = normalizeOptionalText(formData.get("title"));
  const body = normalizeOptionalText(formData.get("body"));

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: "Choose a rating from 1 to 5 stars.",
    };
  }

  if (title && (title.length < 2 || title.length > 120)) {
    return {
      success: false,
      error: "Review title must be 2-120 characters.",
    };
  }

  if (body && (body.length < 3 || body.length > 1200)) {
    return {
      success: false,
      error: "Review text must be 3-1200 characters.",
    };
  }

  return {
    success: true,
    data: {
      rating,
      title,
      body,
    },
  };
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
