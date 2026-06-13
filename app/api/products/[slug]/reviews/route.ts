import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/admin/auth";
import { validateProductReviewForm } from "@/lib/products/review-validation";
import { submitCustomerProductReview } from "@/lib/products/reviews";
import {
  checkRateLimit,
  rateLimitedRedirect,
  rateLimitRules,
} from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/products/[slug]/reviews">,
) {
  const { slug } = await context.params;
  const productPath = `/products/${slug}`;
  const profile = await getCurrentProfile();

  if (!profile) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", productPath);

    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (profile.role !== "customer") {
    return redirectWithStatus(request, productPath, "review_unauthorized");
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.accountMutation,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
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

    return redirectWithStatus(request, productPath, "review_error");
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(productPath);

  return redirectWithStatus(request, productPath, "review_saved");
}

function redirectWithStatus(request: Request, path: string, status: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("review", status);

  return NextResponse.redirect(url, { status: 303 });
}
