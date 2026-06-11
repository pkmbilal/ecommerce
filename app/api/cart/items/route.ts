import { getCurrentProfile } from "@/lib/admin/auth";
import {
  addCustomerCartItem,
  getCustomerCartItems,
  getCustomerCartSummary,
  mergeCustomerCartItems,
} from "@/lib/cart/customer-cart";
import type { CartItemInput } from "@/lib/cart/types";
import {
  checkRateLimit,
  rateLimitedJson,
  rateLimitRules,
} from "@/lib/security/rate-limit";

type AddCartItemRequestBody = {
  productId?: unknown;
  quantity?: unknown;
  items?: CartItemInput[];
};

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to update database cart." }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.cartWrite,
    subject: profile.userId,
  });

  if (!rateLimit.allowed) {
    return rateLimitedJson(rateLimit);
  }

  let body: AddCartItemRequestBody;

  try {
    body = (await request.json()) as AddCartItemRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (Array.isArray(body.items)) {
      await mergeCustomerCartItems(profile.userId, body.items);
    } else {
      const productId = typeof body.productId === "string" ? body.productId : "";
      const quantity =
        typeof body.quantity === "number" && Number.isInteger(body.quantity)
          ? body.quantity
          : 1;

      if (!productId.trim()) {
        return Response.json({ error: "Product is required." }, { status: 400 });
      }

      await addCustomerCartItem({
        profileId: profile.userId,
        productSlug: productId,
        quantity,
      });
    }

    const [items, summary] = await Promise.all([
      getCustomerCartItems(profile.userId),
      getCustomerCartSummary(profile.userId),
    ]);

    return Response.json({ items, summary });
  } catch (error) {
    console.error("Failed to add customer cart item.", error);

    return Response.json(
      { error: "Unable to update cart right now." },
      { status: 500 },
    );
  }
}
