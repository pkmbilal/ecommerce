import type { Enums } from "@/lib/supabase/database.types";

export type AppRole = Enums<"app_role">;

const ADMIN_DEFAULT_REDIRECT = "/admin/orders";
const CUSTOMER_DEFAULT_REDIRECT = "/account";

export function getRoleRedirectPath(role: AppRole) {
  return role === "admin" ? ADMIN_DEFAULT_REDIRECT : CUSTOMER_DEFAULT_REDIRECT;
}

export function getSafeRoleRedirectPath(
  role: AppRole,
  requestedPath: string | null | undefined,
) {
  const fallback = getRoleRedirectPath(role);
  const safePath = getSafeInternalPath(requestedPath);

  if (!safePath || safePath === "/login" || safePath === "/admin/login") {
    return fallback;
  }

  if (role === "admin") {
    return safePath.startsWith("/admin/") || safePath === "/account"
      ? safePath
      : fallback;
  }

  return isCustomerAllowedPath(safePath) ? safePath : fallback;
}

export function getSafeInternalPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}

function isCustomerAllowedPath(path: string) {
  return (
    path === "/account" ||
    path === "/checkout" ||
    path === "/products" ||
    path.startsWith("/products?") ||
    path.startsWith("/products/") ||
    path.startsWith("/order-confirmation")
  );
}
