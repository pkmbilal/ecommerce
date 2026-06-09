import "server-only";

import type { CartItemInput, CartSummary } from "@/lib/cart/types";
import { summarizeCartItems } from "@/lib/cart/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type ProductLookupRow = {
  id: string;
  slug: string;
};

type CartRow = {
  id: string;
};

type CartItemRow = {
  quantity: number;
  products:
    | {
        slug: string;
      }
    | {
        slug: string;
      }[]
    | null;
};

export async function getCustomerCartItems(
  profileId: string,
): Promise<CartItemInput[]> {
  const supabase = createSupabaseServiceClient();
  const cart = await getExistingCart(profileId);

  if (!cart) {
    return [];
  }

  const { data, error } = await supabase
    .from("customer_cart_items")
    .select("quantity, products(slug)")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load cart items: ${error.message}`);
  }

  return (data ?? []).flatMap((row) => {
    const item = row as unknown as CartItemRow;
    const product = Array.isArray(item.products) ? item.products[0] : item.products;

    return product?.slug
      ? [{ productId: product.slug, quantity: item.quantity }]
      : [];
  });
}

export async function getCustomerCartSummary(
  profileId: string,
): Promise<CartSummary> {
  return summarizeCartItems(await getCustomerCartItems(profileId));
}

export async function addCustomerCartItem({
  profileId,
  productSlug,
  quantity = 1,
}: {
  profileId: string;
  productSlug: string;
  quantity?: number;
}) {
  const resolvedQuantity = normalizeQuantity(quantity);
  const cart = await getOrCreateCart(profileId);
  const product = await getActiveProductBySlug(productSlug);
  const supabase = createSupabaseServiceClient();
  const { data: existingItem, error: existingError } = await supabase
    .from("customer_cart_items")
    .select("quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load cart item: ${existingError.message}`);
  }

  const nextQuantity = Math.min(
    ((existingItem?.quantity as number | undefined) ?? 0) + resolvedQuantity,
    99,
  );

  const { error } = await supabase.from("customer_cart_items").upsert(
    {
      cart_id: cart.id,
      product_id: product.id,
      quantity: nextQuantity,
    },
    { onConflict: "cart_id,product_id" },
  );

  if (error) {
    throw new Error(`Failed to add cart item: ${error.message}`);
  }
}

export async function updateCustomerCartItem({
  profileId,
  productSlug,
  quantity,
}: {
  profileId: string;
  productSlug: string;
  quantity: number;
}) {
  if (!Number.isInteger(quantity)) {
    throw new Error("Cart quantity must be an integer.");
  }

  if (quantity < 1) {
    await removeCustomerCartItem({ profileId, productSlug });
    return;
  }

  const cart = await getOrCreateCart(profileId);
  const product = await getActiveProductBySlug(productSlug);
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("customer_cart_items").upsert(
    {
      cart_id: cart.id,
      product_id: product.id,
      quantity: Math.min(quantity, 99),
    },
    { onConflict: "cart_id,product_id" },
  );

  if (error) {
    throw new Error(`Failed to update cart item: ${error.message}`);
  }
}

export async function removeCustomerCartItem({
  profileId,
  productSlug,
}: {
  profileId: string;
  productSlug: string;
}) {
  const cart = await getExistingCart(profileId);

  if (!cart) {
    return;
  }

  const product = await getActiveProductBySlug(productSlug);
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("customer_cart_items")
    .delete()
    .eq("cart_id", cart.id)
    .eq("product_id", product.id);

  if (error) {
    throw new Error(`Failed to remove cart item: ${error.message}`);
  }
}

export async function clearCustomerCart(profileId: string) {
  const cart = await getExistingCart(profileId);

  if (!cart) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("customer_cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) {
    throw new Error(`Failed to clear cart: ${error.message}`);
  }
}

export async function mergeCustomerCartItems(
  profileId: string,
  items: CartItemInput[],
) {
  const normalizedItems = normalizeCartItems(items);

  for (const item of normalizedItems) {
    await addCustomerCartItem({
      profileId,
      productSlug: item.productId,
      quantity: item.quantity,
    });
  }
}

async function getExistingCart(profileId: string): Promise<CartRow | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("customer_carts")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load customer cart: ${error.message}`);
  }

  return data;
}

async function getOrCreateCart(profileId: string): Promise<CartRow> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("customer_carts")
    .upsert({ profile_id: profileId }, { onConflict: "profile_id" })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to prepare customer cart: ${error.message}`);
  }

  return data;
}

async function getActiveProductBySlug(slug: string): Promise<ProductLookupRow> {
  const productSlug = slug.trim();

  if (!productSlug) {
    throw new Error("Product slug is required.");
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug")
    .eq("slug", productSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product is no longer available.");
  }

  return data;
}

function normalizeQuantity(quantity: number) {
  return Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, 99) : 1;
}

function normalizeCartItems(items: CartItemInput[]) {
  const quantitiesByProductId = new Map<string, number>();

  for (const item of items.slice(0, 20)) {
    if (
      typeof item.productId !== "string" ||
      item.productId.trim().length === 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      continue;
    }

    const productId = item.productId.trim();
    quantitiesByProductId.set(
      productId,
      Math.min((quantitiesByProductId.get(productId) ?? 0) + item.quantity, 99),
    );
  }

  return Array.from(quantitiesByProductId, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
