import { summarizeCartItems } from "@/lib/cart/validation";
import { getCurrentProfile } from "@/lib/admin/auth";
import { placeCodOrder } from "@/lib/checkout/place-order";
import { validateCheckoutInput } from "@/lib/checkout/validation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCheckoutInput(
    body && typeof body === "object" ? body : {},
  );

  if (!validation.success) {
    return Response.json({ errors: validation.errors }, { status: 400 });
  }

  const summary = await summarizeCartItems(validation.data.items);

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
    const profile = await getCurrentProfile();
    const order = await placeCodOrder({
      ...validation.data,
      profileId: profile?.userId,
    });
    return Response.json({ order });
  } catch (error) {
    return Response.json(
      {
        errors: {
          order:
            error instanceof Error
              ? error.message
              : "Unable to place order right now.",
        },
      },
      { status: 500 },
    );
  }
}
