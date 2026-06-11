import type { CartItemInput } from "@/lib/cart/types";
import { summarizeCartItems } from "@/lib/cart/validation";
import {
  checkRateLimit,
  rateLimitedJson,
  rateLimitRules,
} from "@/lib/security/rate-limit";

type CartSummaryRequestBody = {
  items?: CartItemInput[];
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    request,
    rule: rateLimitRules.cartSummary,
  });

  if (!rateLimit.allowed) {
    return rateLimitedJson(rateLimit);
  }

  let body: CartSummaryRequestBody;

  try {
    body = (await request.json()) as CartSummaryRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return Response.json({ error: "Cart items are required." }, { status: 400 });
  }

  try {
    const summary = await summarizeCartItems(body.items);
    return Response.json(summary);
  } catch {
    return Response.json(
      { error: "Unable to summarize cart right now." },
      { status: 500 },
    );
  }
}
