import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  createOptionalSupabaseServiceClient,
  createSupabaseAuthServerClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

import type { ProductReviewInput } from "./review-validation";

export type ProductReviewStatus = Enums<"product_review_status">;

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

export type AdminProductReview = ProductReview & {
  status: ProductReviewStatus;
  customerName: string;
};

type ProductIdRow = {
  id: string;
  slug: string;
};

type ProductReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status?: ProductReviewStatus;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
};

type EligibleOrderItemRow = {
  id: string;
};

const REVIEWABLE_ORDER_STATUSES = [
  "confirmed",
  "out_for_delivery",
  "delivered",
] as const;

export async function listPublishedProductReviews(
  productSlug: string,
  limit = 8,
): Promise<ProductReview[]> {
  if (!getSupabasePublicEnv()) {
    return [];
  }

  const product = await getActiveProductIdBySlug(productSlug);

  if (!product) {
    return [];
  }

  const supabase = createOptionalSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, created_at, profiles(full_name, email)")
    .eq("product_id", product.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load product reviews: ${error.message}`);
  }

  return ((data ?? []) as unknown as ProductReviewRow[]).map(mapProductReview);
}

export async function getCustomerReviewState({
  productSlug,
  userId,
}: {
  productSlug: string;
  userId?: string;
}): Promise<CustomerReviewState> {
  if (!userId || !getSupabasePublicEnv()) {
    return { canReview: false };
  }

  const product = await getActiveProductIdBySlug(productSlug);

  if (!product) {
    return { canReview: false };
  }

  const supabase = await createSupabaseAuthServerClient();
  const [{ data: reviewData, error: reviewError }, eligibleOrderItem] =
    await Promise.all([
      supabase
        .from("product_reviews")
        .select("id, rating, title, body, created_at, profiles(full_name, email)")
        .eq("product_id", product.id)
        .eq("profile_id", userId)
        .maybeSingle(),
      getEligibleOrderItemForReview({
        productId: product.id,
        userId,
      }),
    ]);

  if (reviewError) {
    throw new Error(`Failed to load your review: ${reviewError.message}`);
  }

  return {
    canReview: Boolean(eligibleOrderItem),
    existingReview: reviewData
      ? mapProductReview(reviewData as unknown as ProductReviewRow)
      : undefined,
  };
}

export async function submitCustomerProductReview({
  productSlug,
  userId,
  input,
}: {
  productSlug: string;
  userId: string;
  input: ProductReviewInput;
}) {
  const product = await getActiveProductIdBySlug(productSlug);

  if (!product) {
    throw new Error("Product not found.");
  }

  const eligibleOrderItem = await getEligibleOrderItemForReview({
    productId: product.id,
    userId,
  });

  if (!eligibleOrderItem) {
    throw new Error(
      "Reviews are available after your order is confirmed, out for delivery, or delivered.",
    );
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("product_id", product.id)
    .eq("profile_id", userId)
    .maybeSingle();

  if (existingReviewError) {
    throw new Error(`Failed to load existing review: ${existingReviewError.message}`);
  }

  const payload = {
    rating: input.rating,
    title: input.title ?? null,
    body: input.body ?? null,
  };

  const { error } = existingReview
    ? await supabase
        .from("product_reviews")
        .update(payload)
        .eq("id", existingReview.id)
    : await supabase.from("product_reviews").insert({
        ...payload,
        product_id: product.id,
        profile_id: userId,
        order_item_id: eligibleOrderItem.id,
        status: "published",
      });

  if (error) {
    throw new Error(`Failed to save review: ${error.message}`);
  }
}

export async function listAdminProductReviews(
  productId: string,
): Promise<AdminProductReview[]> {
  const supabase = createOptionalSupabaseServiceClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, status, created_at, profiles(full_name, email)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load product reviews: ${error.message}`);
  }

  return ((data ?? []) as unknown as ProductReviewRow[]).map((review) => {
    const mapped = mapProductReview(review);

    return {
      ...mapped,
      status: review.status ?? "published",
      customerName: mapped.authorName,
    };
  });
}

export async function hideAdminProductReview({
  productId,
  reviewId,
}: {
  productId: string;
  reviewId: string;
}) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ status: "hidden" })
    .eq("id", reviewId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Failed to hide review: ${error.message}`);
  }
}

async function getActiveProductIdBySlug(slug: string): Promise<ProductIdRow | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  return data as ProductIdRow | null;
}

async function getEligibleOrderItemForReview({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}): Promise<EligibleOrderItemRow | null> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(profile_id, status)")
    .eq("product_id", productId)
    .eq("orders.profile_id", userId)
    .in("orders.status", REVIEWABLE_ORDER_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify review eligibility: ${error.message}`);
  }

  return data as EligibleOrderItemRow | null;
}

function mapProductReview(row: ProductReviewRow): ProductReview {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title ?? undefined,
    body: row.body ?? undefined,
    authorName: row.profiles?.full_name || row.profiles?.email || "SAHA customer",
    createdAt: row.created_at,
  };
}
