import { summarizeCartItems } from "@/lib/cart/validation";
import { getCurrentProfile } from "@/lib/admin/auth";
import {
  clearCustomerCart,
  getCustomerCartItems,
} from "@/lib/cart/customer-cart";
import { placeCodOrder } from "@/lib/checkout/place-order";
import { validateCheckoutInput } from "@/lib/checkout/validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  const validation = validateCheckoutInput(
    body && typeof body === "object" ? body : {},
    { requireItems: !profile },
  );

  if (!validation.success) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  const cartItems = profile
    ? await getCustomerCartItems(profile.userId)
    : validation.data.items;
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
      profileId: profile?.userId,
    });
    if (profile) {
      await clearCustomerCart(profile.userId);
    }
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
