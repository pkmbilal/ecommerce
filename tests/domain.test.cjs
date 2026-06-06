const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { formatSar, calculateDiscountPercent } = require("../lib/money.ts");
const {
  SAUDI_VAT_RATE_BPS,
  calculateOrderTotalHalalas,
  calculateVatHalalas,
} = require("../lib/pricing.ts");
const { validateCheckoutInput } = require("../lib/checkout/validation.ts");
const {
  getSafeInternalPath,
  getSafeRoleRedirectPath,
} = require("../lib/auth/redirects.ts");

const root = path.resolve(__dirname, "..");

test("formats SAR from integer halalas without floating point money", () => {
  assert.equal(formatSar(0), "SAR 0");
  assert.equal(formatSar(9900), "SAR 99");
  assert.equal(formatSar(123456), "SAR 1,234.56");
  assert.equal(formatSar(-1250), "-SAR 12.50");
});

test("calculates discount percentages from integer prices", () => {
  assert.equal(calculateDiscountPercent(24900, 31900), 22);
  assert.equal(calculateDiscountPercent(10000, 10000), null);
  assert.equal(calculateDiscountPercent(12000, 10000), null);
  assert.equal(calculateDiscountPercent(12000), null);
});

test("calculates Saudi VAT and totals in halalas", () => {
  assert.equal(SAUDI_VAT_RATE_BPS, 1500);
  assert.equal(calculateVatHalalas(10000), 1500);
  assert.equal(calculateVatHalalas(333), 50);
  assert.equal(calculateVatHalalas(10000, 500), 500);
  assert.equal(
    calculateOrderTotalHalalas({
      subtotalHalalas: 10000,
      vatHalalas: 1500,
      shippingHalalas: 2500,
    }),
    14000,
  );
});

test("rejects invalid money and VAT inputs", () => {
  assert.throws(() => calculateVatHalalas(10.5), /subtotalHalalas/);
  assert.throws(() => calculateVatHalalas(-1), /subtotalHalalas/);
  assert.throws(() => calculateVatHalalas(1000, 10001), /vatRateBps/);
  assert.throws(
    () =>
      calculateOrderTotalHalalas({
        subtotalHalalas: 1000,
        vatHalalas: 150,
        shippingHalalas: -1,
      }),
    /shippingHalalas/,
  );
});

test("validates checkout input and normalizes duplicate cart items", () => {
  const result = validateCheckoutInput({
    idempotencyKey: "checkout-key-123456",
    customerName: "  Nora Ahmed  ",
    customerPhone: "0551234567",
    deliveryAddress: "King Fahd Road, Riyadh",
    cityRegion: "Riyadh",
    notes: "  Call before delivery  ",
    items: [
      { productId: " linen-abaya-black ", quantity: 1 },
      { productId: "linen-abaya-black", quantity: 3 },
      { productId: "woven-tote-sand", quantity: 150 },
      { productId: "", quantity: 1 },
      { productId: "ignored", quantity: 0 },
    ],
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.customerName, "Nora Ahmed");
    assert.equal(result.data.notes, "Call before delivery");
    assert.deepEqual(result.data.items, [
      { productId: "linen-abaya-black", quantity: 4 },
      { productId: "woven-tote-sand", quantity: 99 },
    ]);
  }
});

test("returns field errors for invalid checkout input", () => {
  const result = validateCheckoutInput({
    idempotencyKey: "short",
    customerName: "A",
    customerPhone: "0412345678",
    deliveryAddress: "Riyadh",
    cityRegion: "",
    items: [],
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.deepEqual(Object.keys(result.errors).sort(), [
      "cityRegion",
      "customerName",
      "customerPhone",
      "deliveryAddress",
      "idempotencyKey",
      "items",
    ]);
  }
});

test("COD placement migration reserves inventory and uses product VAT rates", () => {
  const migration = readMigration(
    "supabase/migrations/20260606110000_use_product_vat_rate_in_cod_totals.sql",
  );

  assert.match(
    migration,
    /v_vat := v_vat \+ round\(\(v_product\.price_halalas \* v_quantity\) \* v_product\.vat_rate_bps::numeric \/ 10000\)::integer;/,
  );
  assert.match(
    migration,
    /set reserved_quantity = reserved_quantity \+ v_quantity/,
  );
  assert.match(migration, /'reservation'/);
  assert.match(migration, /grant execute on function public\.place_cod_order/);
});

test("admin status transition migration enforces order flow and releases inventory on cancellation", () => {
  const migration = readMigration(
    "supabase/migrations/20260605224500_add_admin_order_status_transition_rpc.sql",
  );

  assert.match(migration, /Only pending orders can be confirmed/);
  assert.match(migration, /Only confirmed orders can be sent out for delivery/);
  assert.match(migration, /Only out for delivery orders can be delivered/);
  assert.match(migration, /Finalized orders cannot be changed/);
  assert.match(
    migration,
    /set reserved_quantity = greatest\(reserved_quantity - v_item\.quantity, 0\)/,
  );
  assert.match(migration, /'release'/);
});

test("admin inventory adjustment migration updates stock and writes an audit movement", () => {
  const migration = readMigration(
    "supabase/migrations/20260606123000_add_admin_inventory_adjustment_rpc.sql",
  );

  assert.match(migration, /create or replace function public\.adjust_product_inventory/);
  assert.match(migration, /for update/);
  assert.match(
    migration,
    /target_stock_on_hand < v_inventory\.reserved_quantity/,
  );
  assert.match(migration, /set stock_on_hand = target_stock_on_hand/);
  assert.match(migration, /'adjustment'/);
  assert.match(
    migration,
    /grant execute on function public\.adjust_product_inventory/,
  );
});

test("role based auth migration creates customer profiles and restricts role updates", () => {
  const migration = readMigration(
    "supabase/migrations/20260606133000_add_role_based_profiles.sql",
  );

  assert.match(migration, /create type public\.app_role as enum/);
  assert.match(migration, /'customer'/);
  assert.match(migration, /'admin'/);
  assert.match(migration, /create table public\.profiles/);
  assert.match(migration, /role public\.app_role not null default 'customer'/);
  assert.match(migration, /grant update \(full_name\) on table public\.profiles to authenticated/);
  assert.match(migration, /after insert on auth\.users/);
  assert.match(migration, /execute function public\.handle_new_auth_user/);
});

test("admin role migration permits admin users to manage protected tables", () => {
  const migration = readMigration(
    "supabase/migrations/20260606143000_add_admin_role_rls_policies.sql",
  );

  assert.match(migration, /create or replace function public\.current_user_is_admin/);
  assert.match(migration, /role = 'admin'/);
  assert.match(migration, /grant select, insert, update, delete on table public\.orders to authenticated/);
  assert.match(migration, /create policy "Admins can manage orders"/);
  assert.match(migration, /create policy "Admins can manage inventory items"/);
  assert.match(migration, /grant execute on function public\.transition_cod_order_status/);
  assert.match(migration, /grant execute on function public\.adjust_product_inventory/);
});

test("admin role RPCs run as invoker so RLS enforces admin access", () => {
  const migration = readMigration(
    "supabase/migrations/20260606144500_use_invoker_for_admin_role_functions.sql",
  );

  assert.match(migration, /security invoker/);
  assert.match(migration, /revoke execute on function public\.current_user_is_admin\(\) from public, anon/);
  assert.match(migration, /grant execute on function public\.transition_cod_order_status/);
  assert.match(migration, /to authenticated, service_role/);
  assert.match(migration, /grant execute on function public\.adjust_product_inventory/);
});

test("role based login redirects to safe dashboards", () => {
  assert.equal(getSafeRoleRedirectPath("admin"), "/admin");
  assert.equal(getSafeRoleRedirectPath("customer"), "/account");
  assert.equal(
    getSafeRoleRedirectPath("admin", "/admin/products"),
    "/admin/products",
  );
  assert.equal(
    getSafeRoleRedirectPath("customer", "/admin/orders"),
    "/account",
  );
  assert.equal(getSafeRoleRedirectPath("admin", "/login"), "/admin");
  assert.equal(getSafeRoleRedirectPath("customer", "/login"), "/account");
  assert.equal(getSafeRoleRedirectPath("customer", "/checkout"), "/checkout");
  assert.equal(
    getSafeRoleRedirectPath("customer", "/order-confirmation?order=COD-123"),
    "/order-confirmation?order=COD-123",
  );
  assert.equal(getSafeInternalPath("https://example.com"), undefined);
  assert.equal(getSafeInternalPath("//example.com"), undefined);
});

function readMigration(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
