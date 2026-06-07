import "server-only";

import { isAllowedProductImageUrl } from "@/lib/media/images";
import { uploadProductImageToR2 } from "@/lib/media/r2-upload";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

export type AdminProductSummary = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  categoryName?: string;
  priceHalalas: number;
  compareAtPriceHalalas?: number;
  stockOnHand: number;
  reservedQuantity: number;
  isLowStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
};

export type AdminProductDetail = AdminProductSummary & {
  categoryId?: string;
  description?: string;
  vatRateBps: number;
  badge?: string;
  lowStockThreshold: number;
  images: AdminProductImage[];
};

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
};

export type AdminProductList = {
  items: AdminProductSummary[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

export type AdminProductStatusFilter = "active" | "inactive";
export type AdminProductFeaturedFilter = "featured" | "standard";
export type AdminProductStockFilter =
  | "in_stock"
  | "out_of_stock"
  | "reserved"
  | "low_stock";
export type AdminProductMediaFilter = "with_image" | "missing_image";
export type AdminProductSort = "newest" | "title_asc" | "price_asc" | "price_desc" | "stock_asc";

export type AdminProductFilters = {
  status?: AdminProductStatusFilter;
  featured?: AdminProductFeaturedFilter;
  categoryId?: string;
  stock?: AdminProductStockFilter;
  media?: AdminProductMediaFilter;
  sort?: AdminProductSort;
};

export type CategoryFormInput = {
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

export type ProductFormInput = {
  slug: string;
  sku: string;
  title: string;
  description?: string;
  categoryId?: string;
  priceHalalas: number;
  compareAtPriceHalalas?: number;
  vatRateBps: number;
  badge?: string;
  isActive: boolean;
  isFeatured: boolean;
  lowStockThreshold: number;
  initialStockOnHand?: number;
  images: ProductImageInput[];
};

export type ProductImageInput = {
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
};

const DEFAULT_LIMIT = 20;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,39}$/;

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  title_en: string;
  description_en: string | null;
  category_id: string | null;
  price_halalas: number;
  compare_at_price_halalas: number | null;
  vat_rate_bps: number;
  badge: string | null;
  is_active: boolean;
  is_featured: boolean;
  categories: {
    name_en: string;
  } | null;
  inventory_items: {
    stock_on_hand: number;
    reserved_quantity: number;
    low_stock_threshold: number;
    is_low_stock: boolean;
  } | null;
  product_images: {
    id: string;
    url: string;
    alt_en: string;
    position: number;
    is_primary: boolean;
  }[];
};

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_en, description_en, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name_en,
    description: category.description_en ?? undefined,
    sortOrder: category.sort_order,
    isActive: category.is_active,
  }));
}

export async function createAdminCategory(input: CategoryFormInput) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.from("categories").insert({
    slug: input.slug,
    name_en: input.name,
    description_en: input.description ?? null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  });

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }
}

export async function updateAdminCategory(
  categoryId: string,
  input: CategoryFormInput,
) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("categories")
    .update({
      slug: input.slug,
      name_en: input.name,
      description_en: input.description ?? null,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    })
    .eq("id", categoryId);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
}

export async function listAdminProducts({
  page = 1,
  query,
  filters = {},
}: {
  page?: number;
  query?: string;
  filters?: AdminProductFilters;
} = {}): Promise<AdminProductList> {
  const limit = DEFAULT_LIMIT;
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * limit;
  const supabase = await createSupabaseAuthServerClient();
  const productSelect = getProductSelect({
    requireInventory: Boolean(filters.stock) || filters.sort === "stock_asc",
    requireImage: filters.media === "with_image",
  });
  let request = supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .order("position", {
      referencedTable: "product_images",
      ascending: true,
    })
    .range(offset, offset + limit - 1);

  if (query) {
    const term = escapeSearchTerm(query);
    request = request.or(
      `title_en.ilike.%${term}%,sku.ilike.%${term}%,slug.ilike.%${term}%`,
    );
  }

  if (filters.status === "active") {
    request = request.eq("is_active", true);
  } else if (filters.status === "inactive") {
    request = request.eq("is_active", false);
  }

  if (filters.featured === "featured") {
    request = request.eq("is_featured", true);
  } else if (filters.featured === "standard") {
    request = request.eq("is_featured", false);
  }

  if (filters.categoryId === "unassigned") {
    request = request.is("category_id", null);
  } else if (filters.categoryId) {
    request = request.eq("category_id", filters.categoryId);
  }

  if (filters.stock === "in_stock") {
    request = request.gt("inventory_items.stock_on_hand", 0);
  } else if (filters.stock === "out_of_stock") {
    request = request.eq("inventory_items.stock_on_hand", 0);
  } else if (filters.stock === "reserved") {
    request = request.gt("inventory_items.reserved_quantity", 0);
  } else if (filters.stock === "low_stock") {
    request = request.eq("inventory_items.is_low_stock", true);
  }

  if (filters.media === "missing_image") {
    request = request.is("product_images", null);
  }

  switch (filters.sort) {
    case "title_asc":
      request = request.order("title_en", { ascending: true });
      break;
    case "price_asc":
      request = request.order("price_halalas", { ascending: true });
      break;
    case "price_desc":
      request = request.order("price_halalas", { ascending: false });
      break;
    case "stock_asc":
      request = request.order("inventory_items(stock_on_hand)", {
        ascending: true,
      });
      break;
    case "newest":
    default:
      request = request.order("created_at", { ascending: false });
      break;
  }

  const { data, error, count } = await request;

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const items = ((data ?? []) as unknown as ProductRow[]).map(mapProductSummary);
  const total = count ?? items.length;

  return {
    items,
    total,
    page: safePage,
    limit,
    hasNextPage: offset + items.length < total,
  };
}

export async function getAdminProductDetail(
  productId: string,
): Promise<AdminProductDetail | null> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(getProductSelect())
    .eq("id", productId)
    .order("position", {
      referencedTable: "product_images",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProductDetail(data as unknown as ProductRow);
}

export async function createAdminProduct(input: ProductFormInput) {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: input.slug,
      sku: input.sku,
      title_en: input.title,
      description_en: input.description ?? null,
      category_id: input.categoryId ?? null,
      price_halalas: input.priceHalalas,
      compare_at_price_halalas: input.compareAtPriceHalalas ?? null,
      vat_rate_bps: input.vatRateBps,
      badge: input.badge ?? null,
      is_active: input.isActive,
      is_featured: input.isFeatured,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  const productId = data.id;
  const { error: inventoryError } = await supabase.from("inventory_items").insert({
    product_id: productId,
    stock_on_hand: input.initialStockOnHand ?? 0,
    low_stock_threshold: input.lowStockThreshold,
  });

  if (inventoryError) {
    throw new Error(`Failed to create inventory: ${inventoryError.message}`);
  }

  await replaceProductImages(productId, input.images);

  return productId;
}

export async function updateAdminProduct(
  productId: string,
  input: ProductFormInput,
) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("products")
    .update({
      slug: input.slug,
      sku: input.sku,
      title_en: input.title,
      description_en: input.description ?? null,
      category_id: input.categoryId ?? null,
      price_halalas: input.priceHalalas,
      compare_at_price_halalas: input.compareAtPriceHalalas ?? null,
      vat_rate_bps: input.vatRateBps,
      badge: input.badge ?? null,
      is_active: input.isActive,
      is_featured: input.isFeatured,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  const { error: inventoryError } = await supabase
    .from("inventory_items")
    .update({ low_stock_threshold: input.lowStockThreshold })
    .eq("product_id", productId);

  if (inventoryError) {
    throw new Error(`Failed to update inventory settings: ${inventoryError.message}`);
  }

  await replaceProductImages(productId, input.images);
}

export async function adjustAdminProductInventory({
  productId,
  targetStockOnHand,
  reason,
}: {
  productId: string;
  targetStockOnHand: number;
  reason: string;
}) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.rpc("adjust_product_inventory", {
    product_id_input: productId,
    target_stock_on_hand: targetStockOnHand,
    reason_input: reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function parseCategoryFormData(formData: FormData): CategoryFormInput {
  const input = {
    slug: requireText(formData, "slug"),
    name: requireText(formData, "name"),
    description: optionalText(formData, "description"),
    sortOrder: parseIntegerField(formData, "sortOrder", {
      min: 0,
      fallback: 0,
    }),
    isActive: formData.get("isActive") === "on",
  };

  if (!SLUG_PATTERN.test(input.slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  if (input.name.length < 2) {
    throw new Error("Category name is required.");
  }

  return input;
}

export async function parseProductFormData(
  formData: FormData,
  mode: "create" | "update",
): Promise<ProductFormInput> {
  const input: ProductFormInput = {
    slug: requireText(formData, "slug"),
    sku: requireText(formData, "sku").toUpperCase(),
    title: requireText(formData, "title"),
    description: optionalText(formData, "description"),
    categoryId: optionalText(formData, "categoryId"),
    priceHalalas: parseMoneyHalalas(formData.get("price")),
    compareAtPriceHalalas: parseOptionalMoneyHalalas(formData.get("compareAtPrice")),
    vatRateBps: parseIntegerField(formData, "vatRateBps", {
      min: 0,
      max: 10000,
      fallback: 1500,
    }),
    badge: optionalText(formData, "badge"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    lowStockThreshold: parseIntegerField(formData, "lowStockThreshold", {
      min: 0,
      fallback: 5,
    }),
    initialStockOnHand:
      mode === "create"
        ? parseIntegerField(formData, "initialStockOnHand", {
            min: 0,
            fallback: 0,
          })
        : undefined,
    images: [],
  };

  if (!SLUG_PATTERN.test(input.slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  if (!SKU_PATTERN.test(input.sku)) {
    throw new Error("SKU must be 3-40 uppercase letters, numbers, or hyphens.");
  }

  if (input.title.length < 2) {
    throw new Error("Product title is required.");
  }

  if (
    input.compareAtPriceHalalas !== undefined &&
    input.compareAtPriceHalalas < input.priceHalalas
  ) {
    throw new Error("Compare-at price must be greater than or equal to price.");
  }

  input.images = await parseProductImages(formData, input.slug);

  return input;
}

export function parseInventoryAdjustmentFormData(formData: FormData) {
  const targetStockOnHand = parseIntegerField(formData, "targetStockOnHand", {
    min: 0,
  });
  const reason = requireText(formData, "reason");

  if (reason.length < 3) {
    throw new Error("Inventory adjustment reason is required.");
  }

  return { targetStockOnHand, reason };
}

async function replaceProductImages(
  productId: string,
  images: ProductImageInput[],
) {
  const supabase = await createSupabaseAuthServerClient();
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new Error(`Failed to replace product images: ${deleteError.message}`);
  }

  if (images.length === 0) {
    return;
  }

  const primaryIndex = images.findIndex((image) => image.isPrimary);
  const normalizedImages = images.map((image, index) => ({
    product_id: productId,
    url: image.url,
    alt_en: image.alt,
    position: image.position,
    is_primary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
  }));

  const { error: insertError } = await supabase
    .from("product_images")
    .insert(normalizedImages);

  if (insertError) {
    throw new Error(`Failed to save product images: ${insertError.message}`);
  }
}

function getProductSelect({
  requireInventory = false,
  requireImage = false,
}: {
  requireInventory?: boolean;
  requireImage?: boolean;
} = {}) {
  const inventoryRelation = requireInventory
    ? "inventory_items!inner"
    : "inventory_items";
  const imageRelation = requireImage ? "product_images!inner" : "product_images";

  return `
    id,
    slug,
    sku,
    title_en,
    description_en,
    category_id,
    price_halalas,
    compare_at_price_halalas,
    vat_rate_bps,
    badge,
    is_active,
    is_featured,
    categories(name_en),
    ${inventoryRelation}(stock_on_hand, reserved_quantity, low_stock_threshold, is_low_stock),
    ${imageRelation}(id, url, alt_en, position, is_primary)
  `;
}

function mapProductSummary(row: ProductRow): AdminProductSummary {
  const primaryImage =
    row.product_images.find((image) => image.is_primary) ?? row.product_images[0];
  const inventory = row.inventory_items;

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    title: row.title_en,
    categoryName: row.categories?.name_en,
    priceHalalas: row.price_halalas,
    compareAtPriceHalalas: row.compare_at_price_halalas ?? undefined,
    stockOnHand: inventory?.stock_on_hand ?? 0,
    reservedQuantity: inventory?.reserved_quantity ?? 0,
    isLowStock: inventory?.is_low_stock ?? false,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    imageUrl: isAllowedProductImageUrl(primaryImage?.url)
      ? primaryImage.url
      : undefined,
  };
}

function mapProductDetail(row: ProductRow): AdminProductDetail {
  const summary = mapProductSummary(row);

  return {
    ...summary,
    categoryId: row.category_id ?? undefined,
    description: row.description_en ?? undefined,
    vatRateBps: row.vat_rate_bps,
    badge: row.badge ?? undefined,
    lowStockThreshold: row.inventory_items?.low_stock_threshold ?? 5,
    images: row.product_images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.alt_en,
        position: image.position,
        isPrimary: image.is_primary,
      })),
  };
}

export async function parseProductImages(
  formData: FormData,
  productSlug: string,
): Promise<ProductImageInput[]> {
  const images: ProductImageInput[] = [];

  for (let index = 0; index < 4; index += 1) {
    const file = getOptionalFile(formData, `imageFile${index}`);
    const existingUrl = optionalText(formData, `existingImageUrl${index}`);
    const alt = optionalText(formData, `imageAlt${index}`);
    const url = file
      ? await uploadProductImageToR2({ file, productSlug, slot: index })
      : existingUrl;

    if (!url && !alt) {
      continue;
    }

    if (!url || !isAllowedProductImageUrl(url)) {
      throw new Error("Product image URLs must be approved HTTPS media URLs.");
    }

    if (!alt || alt.length < 3) {
      throw new Error("Each product image needs meaningful alt text.");
    }

    images.push({
      url,
      alt,
      position: index,
      isPrimary: formData.get("primaryImage") === String(index),
    });
  }

  return images;
}

function getOptionalFile(formData: FormData, name: string) {
  const value = formData.get(name);

  if (
    typeof File === "undefined" ||
    !(value instanceof File) ||
    value.size === 0
  ) {
    return undefined;
  }

  return value;
}

function parseMoneyHalalas(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = text.match(/^(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error("Money fields must be valid SAR amounts.");
  }

  const riyals = Number(match[1]);
  const halalas = Number((match[2] ?? "").padEnd(2, "0"));

  if (!Number.isSafeInteger(riyals) || riyals < 0) {
    throw new Error("Money fields must be non-negative SAR amounts.");
  }

  return riyals * 100 + halalas;
}

function parseOptionalMoneyHalalas(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";

  return text ? parseMoneyHalalas(text) : undefined;
}

function parseIntegerField(
  formData: FormData,
  name: string,
  options: {
    min?: number;
    max?: number;
    fallback?: number;
  } = {},
) {
  const raw = formData.get(name);
  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text && options.fallback !== undefined) {
    return options.fallback;
  }

  const value = Number(text);

  if (
    !Number.isInteger(value) ||
    (options.min !== undefined && value < options.min) ||
    (options.max !== undefined && value > options.max)
  ) {
    throw new Error(`${name} must be a valid integer.`);
  }

  return value;
}

function requireText(formData: FormData, name: string) {
  const value = optionalText(formData, name);

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function optionalText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function escapeSearchTerm(value: string) {
  return value.replaceAll("%", "\\%").replaceAll(",", "\\,").trim();
}
