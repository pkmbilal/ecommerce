import { Star } from "lucide-react";
import Link from "next/link";

import type {
  CustomerReviewState,
  ProductReview,
} from "@/lib/products/reviews";

type ProductReviewsProps = {
  productSlug: string;
  productTitle: string;
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  customerState: CustomerReviewState;
  status?: string;
  isSignedInCustomer: boolean;
};

export function ProductReviews({
  productSlug,
  productTitle,
  rating,
  reviewCount,
  reviews,
  customerState,
  status,
  isSignedInCustomer,
}: ProductReviewsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 border-t border-stone-300/80 pt-10 lg:grid-cols-[0.42fr_0.58fr]">
        <div>
          <p className="editorial-kicker">Customer reviews</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            Reviews for {productTitle}
          </h2>
          <div className="mt-5 flex items-center gap-3">
            <StarRating rating={rating} size="lg" />
            <span className="text-sm font-bold text-zinc-700">
              {reviewCount > 0
                ? `${rating.toFixed(1)} from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-600">
            Reviews can be submitted after a cash on delivery order is confirmed,
            out for delivery, or delivered.
          </p>
        </div>

        <div className="grid gap-5">
          <ReviewStatusMessage status={status} />
          <ReviewForm
            productSlug={productSlug}
            existingReview={customerState.existingReview}
            canReview={customerState.canReview}
            isSignedInCustomer={isSignedInCustomer}
          />
          <div className="grid gap-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-[0_18px_50px_-38px_rgba(20,18,15,0.65)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRating rating={review.rating} />
                    <time
                      dateTime={review.createdAt}
                      className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      {new Date(review.createdAt).toLocaleDateString("en-SA")}
                    </time>
                  </div>
                  <h3 className="mt-3 text-base font-black text-zinc-950">
                    {review.title ?? "Customer review"}
                  </h3>
                  {review.body ? (
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      {review.body}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm font-bold text-zinc-600">
                    {review.authorName}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6">
                <h3 className="text-base font-black text-zinc-950">
                  No customer reviews yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Confirmed customers will be able to share the first review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewForm({
  productSlug,
  existingReview,
  canReview,
  isSignedInCustomer,
}: {
  productSlug: string;
  existingReview?: ProductReview;
  canReview: boolean;
  isSignedInCustomer: boolean;
}) {
  if (!isSignedInCustomer) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white/85 p-5">
        <p className="text-sm font-semibold text-zinc-700">
          Sign in as a customer to review products you have ordered.
        </p>
        <Link
          href={`/login?next=/products/${productSlug}`}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white/85 p-5">
        <h3 className="text-base font-black text-zinc-950">
          Review unlocks after confirmation
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          You can review this product when one of your orders containing it is
          confirmed, out for delivery, or delivered.
        </p>
      </div>
    );
  }

  return (
    <form
      action={`/api/products/${productSlug}/reviews`}
      method="post"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_20px_55px_-42px_rgba(20,18,15,0.65)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-zinc-950">
            {existingReview ? "Update your review" : "Write a review"}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Your review publishes immediately.
          </p>
        </div>
        <RatingInput defaultRating={existingReview?.rating ?? 5} />
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-zinc-800">
          Title
          <input
            name="title"
            defaultValue={existingReview?.title}
            maxLength={120}
            placeholder="Great fit and fast confirmation"
            className="h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-800/10"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-zinc-800">
          Review
          <textarea
            name="body"
            defaultValue={existingReview?.body}
            maxLength={1200}
            rows={4}
            placeholder="Share details about quality, fit, delivery, or packaging."
            className="resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-zinc-950 outline-none transition focus:border-emerald-700 focus:ring-3 focus:ring-emerald-800/10"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-5 h-11 rounded-full bg-emerald-800 px-6 text-sm font-black text-white transition hover:bg-zinc-950"
      >
        {existingReview ? "Save review" : "Publish review"}
      </button>
    </form>
  );
}

function RatingInput({ defaultRating }: { defaultRating: number }) {
  return (
    <fieldset>
      <legend className="sr-only">Rating</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="group grid size-10 cursor-pointer place-items-center rounded-full border border-stone-300 bg-stone-50 text-amber-500 transition hover:border-amber-500 hover:bg-amber-50"
            title={`${value} star${value === 1 ? "" : "s"}`}
          >
            <input
              className="peer sr-only"
              type="radio"
              name="rating"
              value={value}
              defaultChecked={value === defaultRating}
              required
            />
            <Star
              aria-hidden="true"
              className="size-5 fill-none peer-checked:fill-current peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-800"
            />
            <span className="sr-only">
              {value} star{value === 1 ? "" : "s"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const starClass = size === "lg" ? "size-5" : "size-4";

  return (
    <span
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`${starClass} ${
            index + 1 <= Math.round(rating) ? "fill-current" : "fill-none"
          }`}
        />
      ))}
    </span>
  );
}

function ReviewStatusMessage({ status }: { status?: string }) {
  if (!status) {
    return null;
  }

  const isError =
    status === "review_error" ||
    status === "review_invalid" ||
    status === "review_unauthorized" ||
    status === "rate_limited";

  return (
    <p
      role="status"
      className={`rounded-xl px-4 py-3 text-sm font-bold ${
        isError
          ? "bg-rose-50 text-rose-800"
          : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {getReviewStatusText(status)}
    </p>
  );
}

function getReviewStatusText(status: string) {
  switch (status) {
    case "review_saved":
      return "Your review was published.";
    case "review_invalid":
      return "Choose a star rating and check your review text.";
    case "review_unauthorized":
      return "Only customer accounts can publish product reviews.";
    case "rate_limited":
      return "Too many review updates. Try again shortly.";
    case "review_error":
    default:
      return "We could not save your review. Check your order status and try again.";
  }
}
