import { getCurrentProfile } from "@/lib/admin/auth";
import {
  getCustomerCartItems,
  getCustomerCartSummary,
  removeCustomerCartItem,
  updateCustomerCartItem,
} from "@/lib/cart/customer-cart";

type UpdateCartItemRequestBody = {
  quantity?: unknown;
};

type CartItemRouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PATCH(request: Request, context: CartItemRouteContext) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to update database cart." }, { status: 401 });
  }

  let body: UpdateCartItemRequestBody;

  try {
    body = (await request.json()) as UpdateCartItemRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.quantity !== "number" || !Number.isInteger(body.quantity)) {
    return Response.json({ error: "Quantity is required." }, { status: 400 });
  }

  const { productId } = await context.params;

  try {
    await updateCustomerCartItem({
      profileId: profile.userId,
      productSlug: decodeURIComponent(productId),
      quantity: body.quantity,
    });

    return Response.json(await getUpdatedCart(profile.userId));
  } catch (error) {
    console.error("Failed to update customer cart item.", error);

    return Response.json(
      { error: "Unable to update cart right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: CartItemRouteContext) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to update database cart." }, { status: 401 });
  }

  const { productId } = await context.params;

  try {
    await removeCustomerCartItem({
      profileId: profile.userId,
      productSlug: decodeURIComponent(productId),
    });

    return Response.json(await getUpdatedCart(profile.userId));
  } catch (error) {
    console.error("Failed to remove customer cart item.", error);

    return Response.json(
      { error: "Unable to update cart right now." },
      { status: 500 },
    );
  }
}

async function getUpdatedCart(profileId: string) {
  const [items, summary] = await Promise.all([
    getCustomerCartItems(profileId),
    getCustomerCartSummary(profileId),
  ]);

  return { items, summary };
}
