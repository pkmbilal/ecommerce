import "server-only";

import {
  products as fallbackProducts,
  type Product,
} from "@/lib/storefront-data";
import { resolveProductImageUrl } from "@/lib/media/images";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  createOptionalSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

import type { CartItemInput, CartSummary } from "./types";

type CartProductRow = {
  slug: string;
  title_en: string;
  price_halalas: number;
  product_images: {
    url: string;
    alt_en: string;
  }[];
  inventory_items?: {
    stock_on_hand: number;
    reserved_quantity: number;
  } | null;
};

export async function summarizeCartItems(
  inputItems: CartItemInput[],
): Promise<CartSummary> {
  const normalizedItems = normalizeCartItems(inputItems);

  if (normalizedItems.length === 0) {
    return {
      items: [],
      estimatedSubtotalHalalas: 0,
      issues: [],
    };
  }

  const products = await getCartProducts(
    normalizedItems.map((item) => item.productId),
  );
  const productById = new Map(products.map((product) => [product.slug, product]));
  const issues: CartSummary["issues"] = [];
  const items = normalizedItems.flatMap((item) => {
    const product = productById.get(item.productId);

    if (!product) {
      issues.push({
        productId: item.productId,
        message: "This product is no longer available.",
      });
      return [];
    }

    const availableQuantity = product.inventory_items
      ? Math.max(
          product.inventory_items.stock_on_hand -
            product.inventory_items.reserved_quantity,
          0,
        )
      : undefined;
    const isAvailable =
      availableQuantity === undefined || availableQuantity >= item.quantity;

    if (!isAvailable) {
      issues.push({
        productId: item.productId,
        message: "Requested quantity is not available.",
      });
    }

    const primaryImage = product.product_images[0];
    const fallbackImageUrl = fallbackProducts[0].imageUrl;

    return [
      {
        productId: product.slug,
        title: product.title_en,
        imageUrl: resolveProductImageUrl(primaryImage?.url, fallbackImageUrl),
        imageAlt: primaryImage?.alt_en ?? product.title_en,
        unitPriceHalalas: product.price_halalas,
        quantity: item.quantity,
        lineSubtotalHalalas: product.price_halalas * item.quantity,
        availableQuantity,
        isAvailable,
      },
    ];
  });

  return {
    items,
    estimatedSubtotalHalalas: items.reduce(
      (total, item) => total + item.lineSubtotalHalalas,
      0,
    ),
    issues,
  };
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
    const quantity = Math.min(item.quantity, 99);
    quantitiesByProductId.set(
      productId,
      Math.min((quantitiesByProductId.get(productId) ?? 0) + quantity, 99),
    );
  }

  return Array.from(quantitiesByProductId, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

async function getCartProducts(productIds: string[]): Promise<CartProductRow[]> {
  if (!getSupabasePublicEnv()) {
    return fallbackProducts
      .filter((product) => productIds.includes(product.id))
      .map(mapFallbackProduct);
  }

  const serviceClient = createOptionalSupabaseServiceClient();

  if (serviceClient) {
    const { data, error } = await serviceClient
      .from("products")
      .select(
        `
        slug,
        title_en,
        price_halalas,
        product_images(url, alt_en),
        inventory_items(stock_on_hand, reserved_quantity)
      `,
      )
      .eq("is_active", true)
      .in("slug", productIds);

    if (error) {
      throw new Error(`Failed to validate cart inventory: ${error.message}`);
    }

    return (data ?? []) as unknown as CartProductRow[];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, title_en, price_halalas, product_images(url, alt_en)")
    .eq("is_active", true)
    .in("slug", productIds);

  if (error) {
    throw new Error(`Failed to validate cart products: ${error.message}`);
  }

  return (data ?? []) as unknown as CartProductRow[];
}

function mapFallbackProduct(product: Product): CartProductRow {
  return {
    slug: product.id,
    title_en: product.title,
    price_halalas: product.priceHalalas,
    product_images: [
      {
        url: product.imageUrl,
        alt_en: product.imageAlt,
      },
    ],
    inventory_items: {
      stock_on_hand: 99,
      reserved_quantity: 0,
    },
  };
}
