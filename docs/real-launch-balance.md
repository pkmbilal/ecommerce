# Real Launch Balance

## Current Functional Status

The app is functional as a cash-on-delivery ecommerce MVP. It has a storefront,
Supabase-backed product browsing, product detail pages, cart state, server-side
cart validation, COD checkout, idempotent order creation, inventory reservation,
order confirmation, admin login, admin order list/detail screens, order status
transitions, R2 media URL support, and focused tests for core money and checkout
behavior.

This document tracks the remaining work needed for a real launch, where a store
owner can operate the catalog and orders with real product data, stable media,
basic abuse protection, and operational checks.

## Launch-Critical Features

### 1. Admin Catalog Management

Suggested branch: `feature/admin-catalog-management`

- Add protected admin screens for categories and products.
- Support creating and editing product title, slug, SKU, description, category,
  SAR price, compare-at price, VAT rate, active/featured flags, badge, and sort
  position.
- Support inventory edits with explicit inventory movement records instead of
  silent stock changes.
- Support product image metadata management using existing R2 URL validation.
- Keep privileged Supabase writes server-only and validate all admin input.

Acceptance checks:

- Admin can create, update, activate, deactivate, and feature products.
- Admin can adjust stock and see an auditable inventory movement.
- Product edits appear on the storefront without exposing service keys.
- `npm run test`, `npm run lint`, and `npm run build` pass.

### 2. Production Media And Catalog Data

Suggested branch: `feature/production-media-data`

- Create the R2 bucket and HTTPS public media domain.
- Upload real product and category images into a stable folder layout.
- Replace seed/demo product data and Unsplash image URLs with real catalog rows.
- Keep Unsplash only as a local development fallback, not as launch catalog data.
- Confirm all product images have meaningful alt text.

Acceptance checks:

- Production products render from R2-backed URLs or approved static assets.
- `next/image` remote patterns remain restricted to approved hosts.
- Invalid or missing media URLs safely fall back without breaking product pages.

### 3. Rate Limiting And Security Hardening

Suggested branch: `feature/rate-limiting-security`

- Add rate limiting for checkout, cart summary, admin login, admin status
  actions, and product search once search is implemented.
- Strengthen admin authentication beyond a single shared env token before public
  launch.
- Enable Supabase Auth leaked password protection from the dashboard when the
  project plan supports it.
- Review route handlers for structured errors that do not leak database details.
- Confirm privileged Supabase clients are imported only by server-only modules.
- Keep RLS policies consolidated so Supabase Advisor does not report overlapping
  permissive policies for the same role/action.

Acceptance checks:

- Repeated abusive requests receive controlled error responses.
- Admin operations require server-side authorization.
- Supabase security advisor reports no security lints.
- Secrets are not exposed through client bundles or `NEXT_PUBLIC_` variables.

### 4. Customer Order Lookup

Suggested branch: `feature/customer-order-lookup`

- Add a customer-facing order lookup page.
- Require public order ID and Saudi phone number before showing order status.
- Show safe order details only: status, items, totals, delivery city/region, and
  created date.
- Do not expose internal UUIDs, inventory movement details, or admin notes.

Acceptance checks:

- Correct public order ID plus phone shows the matching COD order.
- Wrong phone or unknown order returns a generic not-found response.
- Lookup is rate limited before launch.

### 5. Delivery Rules

Suggested branch: `feature/delivery-rules`

- Add a delivery service layer for city/region-based shipping fees and delivery
  estimates.
- Keep shipping totals calculated server-side during checkout.
- Optionally support a free-shipping threshold if the business wants it.
- Store delivery assumptions clearly on orders for admin review.

Acceptance checks:

- Checkout total includes the server-calculated delivery fee.
- Admin order detail shows delivery fee and city/region.
- Tests cover shipping fee calculation and total recomputation.

## Operational Readiness

- Configure production environment variables for Supabase, admin auth, and R2.
- Run Supabase migrations against production through the normal migration flow.
- Run Supabase security and performance advisors after schema changes.
- Confirm database backups and rollback expectations before accepting real
  orders.
- Review logs for checkout, admin actions, and Supabase errors during staging QA.
- Manually verify mobile and desktop flows:
  - storefront
  - product listing and detail
  - cart drawer
  - checkout
  - order confirmation
  - admin order management
  - admin catalog management when implemented

## Nice-To-Have After Launch

- Product search and sort improvements.
- Customer accounts and saved addresses.
- Arabic and RTL UI pass.
- Promotions, coupons, or discount rules.
- Analytics and conversion tracking.
- Email/SMS order notifications.
- Online payments remain out of V1 unless explicitly requested later.

## Suggested Branch Order

1. `feature/admin-catalog-management`
2. `feature/production-media-data`
3. `feature/rate-limiting-security`
4. `feature/customer-order-lookup`
5. `feature/delivery-rules`

## Final Launch Checklist

- `npm run test` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Supabase security advisor is clean.
- Performance advisor findings are reviewed and either fixed or intentionally
  deferred.
- Real catalog data and R2 media are in place.
- Admin can operate products, inventory, and orders without direct database
  access.
- Checkout creates COD orders with server-calculated totals only.
- Mobile and desktop QA is complete for the full shopping and admin flow.
