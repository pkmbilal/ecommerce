import { getCurrentProfile } from "@/lib/admin/auth";
import {
  clearCustomerCart,
  getCustomerCartItems,
  getCustomerCartSummary,
} from "@/lib/cart/customer-cart";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to load database cart." }, { status: 401 });
  }

  try {
    const [items, summary] = await Promise.all([
      getCustomerCartItems(profile.userId),
      getCustomerCartSummary(profile.userId),
    ]);

    return Response.json({ items, summary });
  } catch (error) {
    console.error("Failed to load customer cart.", error);

    return Response.json(
      { error: "Unable to load cart right now." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return Response.json({ error: "Sign in to clear database cart." }, { status: 401 });
  }

  try {
    await clearCustomerCart(profile.userId);

    return Response.json({
      items: [],
      summary: {
        items: [],
        estimatedSubtotalHalalas: 0,
        issues: [],
      },
    });
  } catch (error) {
    console.error("Failed to clear customer cart.", error);

    return Response.json(
      { error: "Unable to clear cart right now." },
      { status: 500 },
    );
  }
}
