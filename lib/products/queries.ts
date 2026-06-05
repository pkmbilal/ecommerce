import "server-only";

import { cache } from "react";

import { products as fallbackProducts, type Product } from "@/lib/storefront-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type ProductImageRow = {
  url: string;
  alt_en: string;
};

type ProductWithImagesRow = {
  id: string;
  slug: string;
  title_en: string;
  price_halalas: number;
  compare_at_price_halalas: number | null;
  rating: number;
  review_count: number;
  badge: string | null;
  categories: {
    name_en: string;
  } | null;
  product_images: ProductImageRow[];
};

export const getStorefrontProducts = cache(async (): Promise<Product[]> => {
  if (!getSupabasePublicEnv()) {
    return fallbackProducts;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      title_en,
      price_halalas,
      compare_at_price_halalas,
      rating,
      review_count,
      badge,
      categories(name_en),
      product_images(url, alt_en)
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .order("position", {
      referencedTable: "product_images",
      ascending: true,
    })
    .limit(12);

  if (error) {
    throw new Error(`Failed to load storefront products: ${error.message}`);
  }

  return ((data ?? []) as ProductWithImagesRow[]).map(mapProductRow);
});

function mapProductRow(row: ProductWithImagesRow): Product {
  const primaryImage = row.product_images[0];

  return {
    id: row.slug,
    title: row.title_en,
    category: row.categories?.name_en ?? "Collection",
    rating: row.rating,
    reviews: row.review_count,
    priceHalalas: row.price_halalas,
    compareAtPriceHalalas: row.compare_at_price_halalas ?? undefined,
    imageUrl: primaryImage?.url ?? fallbackProducts[0].imageUrl,
    imageAlt: primaryImage?.alt_en ?? row.title_en,
    badge: row.badge ?? undefined,
  };
}
