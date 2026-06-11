import { summarizeCartItems } from "@/lib/cart/validation";
import { getCurrentProfile } from "@/lib/admin/auth";
import {
  clearCustomerCart,
  getCustomerCartItems,
} from "@/lib/cart/customer-cart";
import { placeCodOrder } from "@/lib/checkout/place-order";
import { validateCheckoutInput } from "@/lib/checkout/validation";
import {
  checkRateLimit,
  getClientIp,
  rateLimitedJson,
  rateLimitRules,
} from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type CheckoutRequestBody = {
  turnstileToken?: unknown;
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json(
      { errors: { order: "Sign in before checkout." } },
      { status: 401 },
    );
  }

  if (profile.role !== "customer") {
    return Response.json(
      { errors: { order: "Customer account required for checkout." } },
      { status: 403 },
    );
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.checkout,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
    return rateLimitedJson(
      rateLimit,
      "Too many checkout attempts. Try again shortly.",
    );
  }

  const turnstileToken =
    body && typeof body === "object"
      ? (body as CheckoutRequestBody).turnstileToken
      : undefined;
  const turnstile = await verifyTurnstileToken({
    token: typeof turnstileToken === "string" ? turnstileToken : undefined,
    remoteIp: getClientIp(request),
  });

  if (!turnstile.success) {
    return Response.json(
      {
        errors: {
          verification: "Complete the verification and try again.",
        },
      },
      { status: 400 },
    );
  }

  const validation = validateCheckoutInput(
    body && typeof body === "object" ? body : {},
    { requireItems: false },
  );

  if (!validation.success) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  const cartItems = await getCustomerCartItems(profile.userId);
  const summary = await summarizeCartItems(cartItems);

  if (summary.items.length === 0 || summary.issues.length > 0) {
    return Response.json(
      {
        errors: {
          items:
            summary.issues[0]?.message ??
            "Cart items could not be validated for checkout.",
        },
      },
      { status: 409 },
    );
  }

  try {
    const order = await placeCodOrder({
      ...validation.data,
      items: cartItems,
      profileId: profile.userId,
    });
    await clearCustomerCart(profile.userId);
    return Response.json({ order });
  } catch (error) {
    console.error("Failed to place COD order.", error);

    return Response.json(
      {
        errors: {
          order: "Unable to place order right now.",
        },
      },
      { status: 500 },
    );
  }
}
