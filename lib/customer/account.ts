import "server-only";

import type { Enums } from "@/lib/supabase/database.types";
import { isAllowedProfileAvatarUrl } from "@/lib/media/images";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";

import type { AddressFormInput, ProfileFormInput } from "./validation";

export type CustomerProfile = {
  userId: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: Enums<"app_role">;
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  cityRegion: string;
  deliveryAddress: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
};

export type CustomerFavoriteProduct = {
  productId: string;
  slug: string;
  title: string;
  category: string;
  imageUrl: string;
  imageAlt: string;
  priceHalalas: number;
  compareAtPriceHalalas?: number;
};

type FavoriteRow = {
  product_id: string;
  products: {
    slug: string;
    title_en: string;
    price_halalas: number;
    compare_at_price_halalas: number | null;
    categories: {
      name_en: string;
    } | null;
    product_images: {
      url: string;
      alt_en: string;
    }[];
  } | null;
};

export async function getCustomerProfile(userId: string): Promise<CustomerProfile> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load account profile: ${error.message}`);
  }

  return {
    userId: data?.id ?? userId,
    email: data?.email ?? "",
    fullName: data?.full_name ?? undefined,
    phone: data?.phone ?? undefined,
    avatarUrl: isAllowedProfileAvatarUrl(data?.avatar_url)
      ? (data?.avatar_url ?? undefined)
      : undefined,
    role: data?.role ?? "customer",
  };
}

export async function updateCustomerProfile(
  userId: string,
  input: ProfileFormInput,
) {
  const supabase = await createSupabaseAuthServerClient();
  const updates: {
    full_name: string;
    phone: string | null;
    avatar_url?: string | null;
  } = {
    full_name: input.fullName,
    phone: input.phone ?? null,
  };

  if ("avatarUrl" in input) {
    updates.avatar_url = input.avatarUrl ?? null;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

export async function listCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select(
      "id, label, recipient_name, phone, city_region, delivery_address, notes, is_default, created_at",
    )
    .eq("profile_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error && isMissingCustomerDashboardSchemaError(error.message)) {
    return [];
  }

  if (error) {
    throw new Error(`Failed to load addresses: ${error.message}`);
  }

  return (data ?? []).map((address) => ({
    id: address.id,
    label: address.label,
    recipientName: address.recipient_name,
    phone: address.phone,
    cityRegion: address.city_region,
    deliveryAddress: address.delivery_address,
    notes: address.notes ?? undefined,
    isDefault: address.is_default,
    createdAt: address.created_at,
  }));
}

export async function createCustomerAddress(
  userId: string,
  input: AddressFormInput,
) {
  const supabase = await createSupabaseAuthServerClient();

  if (input.isDefault) {
    await clearDefaultAddress(userId);
  }

  const { error } = await supabase.from("customer_addresses").insert({
    profile_id: userId,
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    city_region: input.cityRegion,
    delivery_address: input.deliveryAddress,
    notes: input.notes ?? null,
    is_default: input.isDefault,
  });

  if (error) {
    throw new Error(`Failed to create address: ${error.message}`);
  }
}

export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: AddressFormInput,
) {
  const supabase = await createSupabaseAuthServerClient();

  if (input.isDefault) {
    await clearDefaultAddress(userId);
  }

  const { error } = await supabase
    .from("customer_addresses")
    .update({
      label: input.label,
      recipient_name: input.recipientName,
      phone: input.phone,
      city_region: input.cityRegion,
      delivery_address: input.deliveryAddress,
      notes: input.notes ?? null,
      is_default: input.isDefault,
    })
    .eq("id", addressId)
    .eq("profile_id", userId);

  if (error) {
    throw new Error(`Failed to update address: ${error.message}`);
  }
}

export async function deleteCustomerAddress(userId: string, addressId: string) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("profile_id", userId);

  if (error) {
    throw new Error(`Failed to delete address: ${error.message}`);
  }
}

export async function setDefaultCustomerAddress(userId: string, addressId: string) {
  const supabase = await createSupabaseAuthServerClient();
  await clearDefaultAddress(userId);

  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("profile_id", userId);

  if (error) {
    throw new Error(`Failed to set default address: ${error.message}`);
  }
}

export async function getFavoriteProductSlugs(userId: string): Promise<Set<string>> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("product_favorites")
    .select("products(slug)")
    .eq("profile_id", userId);

  if (error && isMissingCustomerDashboardSchemaError(error.message)) {
    return new Set();
  }

  if (error) {
    throw new Error(`Failed to load favorites: ${error.message}`);
  }

  return new Set(
    (data ?? [])
      .map((favorite) => favorite.products?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
}

export async function listCustomerFavorites(
  userId: string,
): Promise<CustomerFavoriteProduct[]> {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("product_favorites")
    .select(
      `
      product_id,
      products(
        slug,
        title_en,
        price_halalas,
        compare_at_price_halalas,
        categories(name_en),
        product_images(url, alt_en)
      )
    `,
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });

  if (error && isMissingCustomerDashboardSchemaError(error.message)) {
    return [];
  }

  if (error) {
    throw new Error(`Failed to load favorite products: ${error.message}`);
  }

  return ((data ?? []) as unknown as FavoriteRow[])
    .filter((favorite) => favorite.products)
    .map((favorite) => {
      const product = favorite.products;
      const image = product?.product_images[0];

      return {
        productId: favorite.product_id,
        slug: product?.slug ?? "",
        title: product?.title_en ?? "Product",
        category: product?.categories?.name_en ?? "Collection",
        imageUrl: image?.url ?? "",
        imageAlt: image?.alt_en ?? product?.title_en ?? "Product image",
        priceHalalas: product?.price_halalas ?? 0,
        compareAtPriceHalalas: product?.compare_at_price_halalas ?? undefined,
      };
    });
}

export async function toggleCustomerFavoriteBySlug(
  userId: string,
  productSlug: string,
) {
  const supabase = await createSupabaseAuthServerClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (productError) {
    throw new Error(`Failed to load product: ${productError.message}`);
  }

  if (!product) {
    throw new Error("Product not found.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("product_favorites")
    .select("product_id")
    .eq("profile_id", userId)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load favorite: ${existingError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("product_favorites")
      .delete()
      .eq("profile_id", userId)
      .eq("product_id", product.id);

    if (error) {
      throw new Error(`Failed to remove favorite: ${error.message}`);
    }

    return { isFavorite: false };
  }

  const { error } = await supabase.from("product_favorites").insert({
    profile_id: userId,
    product_id: product.id,
  });

  if (error) {
    throw new Error(`Failed to save favorite: ${error.message}`);
  }

  return { isFavorite: true };
}

export async function removeCustomerFavorite(userId: string, productId: string) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("product_favorites")
    .delete()
    .eq("profile_id", userId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Failed to remove favorite: ${error.message}`);
  }
}

async function clearDefaultAddress(userId: string) {
  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("profile_id", userId)
    .eq("is_default", true);

  if (error) {
    throw new Error(`Failed to clear default address: ${error.message}`);
  }
}

function isMissingCustomerDashboardSchemaError(message: string) {
  return (
    message.includes("customer_addresses") ||
    message.includes("product_favorites") ||
    (message.includes("does not exist") &&
      (message.includes("profile_id") || message.includes("phone")))
  );
}
