import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/admin/auth";
import { validateProductReviewForm } from "@/lib/products/review-validation";
import {
  getProductReviewSectionData,
  submitCustomerProductReview,
} from "@/lib/products/reviews";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/products/[slug]/reviews">,
) {
  const { slug } = await context.params;
  const productPath = `/products/${slug}`;
  const wantsJson = expectsJson(request);
  const profile = await getCurrentProfile();

  if (!profile) {
    if (wantsJson) {
      return Response.json({ status: "review_unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", productPath);

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (profile.role !== "customer") {
    if (wantsJson) {
      return Response.json({ status: "review_unauthorized" }, { status: 403 });
    }

    return redirectWithStatus(request, productPath, "review_unauthorized");
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.accountMutation,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
    if (wantsJson) {
      return Response.json(
        { status: "rate_limited" },
        {
          status: 429,
          headers: rateLimitHeaders(rateLimit),
        },
      );
    }

    return rateLimitedRedirect({
      request,
      path: productPath,
      result: rateLimit,
      statusParam: "review",
      statusValue: "rate_limited",
    });
  }

  const validation = validateProductReviewForm(await request.formData());

  if (!validation.success) {
    if (wantsJson) {
      return Response.json({ status: "review_invalid" }, { status: 400 });
    }

    return redirectWithStatus(request, productPath, "review_invalid");
  }

  try {
    await submitCustomerProductReview({
      productSlug: slug,
      userId: profile.userId,
      input: validation.data,
    });
  } catch (error) {
    console.error("Failed to save product review.", error);

    if (wantsJson) {
      return Response.json({ status: "review_error" }, { status: 400 });
    }

    return redirectWithStatus(request, productPath, "review_error");
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(productPath);

  if (wantsJson) {
    const section = await getProductReviewSectionData({
      productSlug: slug,
      userId: profile.userId,
    });

    return Response.json({ status: "review_saved", section });
  }

  return redirectWithStatus(request, productPath, "review_saved");
}

function redirectWithStatus(request: Request, path: string, status: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("review", status);

  return NextResponse.redirect(url, { status: 303 });
}

function expectsJson(request: Request) {
  return (
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("x-requested-with") === "fetch"
  );
}
