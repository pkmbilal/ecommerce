import "server-only";

import { cache } from "react";

import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type CategoryTile,
  type Product,
} from "@/lib/storefront-data";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CatalogProduct = Product;

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type ProductDetail = CatalogProduct & {
  slug: string;
  sku: string;
  description?: string;
  images: {
    url: string;
    alt: string;
  }[];
};

export type ProductListOptions = {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  featuredOnly?: boolean;
};

export type PaginatedProducts = {
  items: CatalogProduct[];
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
};

type ProductImageRow = {
  url: string;
  alt_en: string;
};

type ProductWithImagesRow = {
  id: string;
  slug: string;
  sku?: string;
  title_en: string;
  description_en?: string | null;
  price_halalas: number;
  compare_at_price_halalas: number | null;
  rating: number;
  review_count: number;
  badge: string | null;
  categories: {
    name_en: string;
    slug: string;
  } | null;
  product_images: ProductImageRow[];
};

const DEFAULT_LIMIT = 8;

export const getStorefrontProducts = cache(
  async (options: ProductListOptions = {}): Promise<PaginatedProducts> => {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const offset = options.offset ?? 0;

    if (!getSupabasePublicEnv()) {
      return getFallbackProducts(options);
    }

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("products")
      .select(getProductListSelect(Boolean(options.categorySlug)), {
        count: "exact",
      })
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .order("position", {
        referencedTable: "product_images",
        ascending: true,
      })
      .range(offset, offset + limit - 1);

    if (options.categorySlug) {
      query = query.eq("categories.slug", options.categorySlug);
    }

    if (options.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to load storefront products: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as ProductWithImagesRow[];
    const items = rows.map(mapProductRow);
    const total = count ?? items.length;

    return {
      items,
      total,
      limit,
      offset,
      hasNextPage: offset + items.length < total,
    };
  },
);

export const getCategories = cache(async (): Promise<ProductCategory[]> => {
  if (!getSupabasePublicEnv()) {
    return fallbackCategories.map((category, index) => ({
      id: category.slug,
      name: category.name,
      slug: category.slug,
      description: category.description ?? `Collection ${index + 1}`,
    }));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_en, description_en")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load product categories: ${error.message}`);
  }

  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name_en,
    slug: category.slug,
    description: category.description_en ?? undefined,
  }));
});

export const getCategoryTiles = cache(async (): Promise<CategoryTile[]> => {
  const fallbackImagesBySlug = new Map(
    fallbackCategories.map((category) => [category.slug, category.imageUrl]),
  );
  const categories = await getCategories();

  return categories.slice(0, 3).map((category, index) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl:
      fallbackImagesBySlug.get(category.slug) ??
      fallbackCategories[index % fallbackCategories.length].imageUrl,
  }));
});

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    if (!getSupabasePublicEnv()) {
      const fallback = fallbackProducts.find((product) => product.id === slug);

      if (!fallback) {
        return null;
      }

      return {
        ...fallback,
        slug: fallback.id,
        sku: fallback.id.toUpperCase(),
        description: `${fallback.title} from the SAHA Saudi-first collection.`,
        images: [{ url: fallback.imageUrl, alt: fallback.imageAlt }],
      };
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        slug,
        sku,
        title_en,
        description_en,
        price_halalas,
        compare_at_price_halalas,
        rating,
        review_count,
        badge,
        categories(name_en, slug),
        product_images(url, alt_en)
      `,
      )
      .eq("is_active", true)
      .eq("slug", slug)
      .order("position", {
        referencedTable: "product_images",
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product ${slug}: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const row = data as ProductWithImagesRow;
    const mapped = mapProductRow(row);

    return {
      ...mapped,
      slug: row.slug,
      sku: row.sku ?? row.slug.toUpperCase(),
      description: row.description_en ?? undefined,
      images: row.product_images.map((image) => ({
        url: image.url,
        alt: image.alt_en,
      })),
    };
  },
);

function getProductListSelect(filterByCategory: boolean) {
  const categoryJoin = filterByCategory ? "categories!inner" : "categories";

  return `
    id,
    slug,
    title_en,
    price_halalas,
    compare_at_price_halalas,
    rating,
    review_count,
    badge,
    ${categoryJoin}(name_en, slug),
    product_images(url, alt_en)
  `;
}

function getFallbackProducts(options: ProductListOptions): PaginatedProducts {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const offset = options.offset ?? 0;
  const filtered = fallbackProducts.filter((product) => {
    if (options.categorySlug && product.categorySlug !== options.categorySlug) {
      return false;
    }

    if (
      options.featuredOnly &&
      !["New", "Best seller"].includes(product.badge ?? "")
    ) {
      return false;
    }

    return true;
  });
  const items = filtered.slice(offset, offset + limit);

  return {
    items,
    total: filtered.length,
    limit,
    offset,
    hasNextPage: offset + items.length < filtered.length,
  };
}

function mapProductRow(row: ProductWithImagesRow): CatalogProduct {
  const primaryImage = row.product_images[0];

  return {
    id: row.slug,
    title: row.title_en,
    category: row.categories?.name_en ?? "Collection",
    categorySlug: row.categories?.slug,
    rating: row.rating,
    reviews: row.review_count,
    priceHalalas: row.price_halalas,
    compareAtPriceHalalas: row.compare_at_price_halalas ?? undefined,
    imageUrl: primaryImage?.url ?? fallbackProducts[0].imageUrl,
    imageAlt: primaryImage?.alt_en ?? row.title_en,
    badge: row.badge ?? undefined,
  };
}
