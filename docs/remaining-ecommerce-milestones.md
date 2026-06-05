# Remaining Ecommerce Milestone Plan

## Summary

Complete the balance of the app in staged milestones: first Supabase foundations, then product browsing backed by the database, then cart and COD checkout, then admin order management, then media/R2 and hardening. The app remains single-vendor, Saudi-first, SAR-priced, VAT-ready, and cash-on-delivery only.

Supabase must be implemented with migrations, explicit grants, and RLS enabled for exposed tables, following Supabase guidance that grants and RLS policies belong together.

## Milestones

### Milestone 1: Supabase Data Foundation

- Install `@supabase/supabase-js` and add server-only Supabase clients.
- Add env validation for Supabase URL and keys:
  - publishable key only where safe
  - secret/service role only in server-only modules
- Create migrations for core tables:
  - `products`
  - `product_images`
  - `categories`
  - `inventory_items`
  - `customers`
  - `orders`
  - `order_items`
  - `inventory_movements`
  - `idempotency_keys`
- Store all money as integer halalas.
- Add order status enum:
  - `pending_confirmation`
  - `confirmed`
  - `out_for_delivery`
  - `delivered`
  - `cancelled`
- Enable RLS on all public tables.
- Grant only required access:
  - anonymous read access for active product/category browsing
  - no anonymous direct writes to orders/inventory
  - server-side order creation through trusted service code or restricted RPC
- Seed a small product catalog matching the current storefront demo data.
- Generate TypeScript database types after migrations.

### Milestone 2: Product Catalog From Supabase

- Replace static product reads with paginated Supabase-backed queries.
- Add product listing data access modules, separate from UI components.
- Support:
  - homepage product sections
  - category filtering
  - active/inactive products
  - primary image selection
  - compare-at price and discount display
- Keep product browsing server-rendered by default.
- Add loading states for product sections.
- Keep static sample data only as a fallback for development if Supabase env vars are missing.

### Milestone 3: Cart Foundation

- Add a small client cart state layer without Redux.
- Cart stores only:
  - product id
  - quantity
  - selected variant/options if added later
- Do not store trusted prices, tax, shipping, discounts, or totals as final order truth.
- Add cart drawer/sheet UI:
  - item list
  - quantity controls
  - remove item
  - estimated subtotal display clearly marked as estimate
  - checkout CTA
- Add server-side cart validation helper that fetches current product price and stock before checkout.

### Milestone 4: COD Checkout

- Add checkout route and form for required V1 data:
  - customer name
  - Saudi phone number
  - delivery address
  - city or region
  - cart items and quantities
  - optional notes
- Add validation schemas reused at every external input boundary.
- Implement server action or route handler for order creation.
- Server must:
  - validate checkout input
  - refetch products/inventory
  - recalculate subtotal, VAT-ready tax fields, shipping, and total
  - reject unavailable or insufficient-stock items
  - use idempotency key to prevent duplicate orders
  - create COD order in `pending_confirmation`
  - reserve inventory and write inventory movement records in the same transaction
- Add order confirmation page showing safe public order details only.

### Milestone 5: Admin Order Management

- Add protected admin area.
- Implement server-side authorization for admin operations.
- Add order list with pagination and status filters.
- Add order detail view with:
  - customer delivery info
  - item list
  - totals
  - inventory reservation status
  - order notes
- Add status actions:
  - confirm
  - mark out for delivery
  - mark delivered
  - cancel
- Cancellation releases reserved inventory when applicable.
- Delivered COD orders become collected revenue only when marked delivered.

### Milestone 6: R2 Media Integration

- Add Cloudflare R2 media helper layer.
- Configure strict `next/image` remote patterns for approved R2 media hostnames.
- Move product images from Unsplash/demo URLs to R2-backed URLs or approved static assets.
- Validate stored media metadata and alt text.
- Keep media helpers isolated from UI.

### Milestone 7: Hardening, Tests, And Verification

- Add targeted tests for:
  - SAR formatting
  - integer money arithmetic
  - VAT calculation
  - cart totals
  - checkout validation
  - COD order creation
  - inventory reservation/release
  - order status transitions
- Run Supabase security and performance advisors after migrations.
- Run:
  - `npm run lint`
  - `npm run build`
- Manually verify:
  - mobile and desktop storefront
  - product browsing
  - cart drawer
  - checkout
  - order confirmation
  - admin order flows
- Check no service keys or privileged Supabase clients are imported into client components.

## Public Interfaces And Types

- Add database-generated TypeScript types from Supabase.
- Add domain-level types for:
  - product summary/detail
  - cart item input
  - checkout input
  - order summary/detail
  - order status
  - inventory movement reason
- Add service modules for:
  - products
  - cart validation
  - checkout/order creation
  - inventory reservation/release
  - admin order transitions
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - server-only Supabase secret/service key variable
  - R2 public media host/config when media milestone starts

## Assumptions

- Use inventory reservation, not immediate permanent decrement, so cancellation can release stock cleanly.
- Supabase Auth will be used for admin authentication when admin flows start.
- V1 remains COD-only with no online payment, wallet, card, gateway, or webhook work.
- Customer checkout can be guest checkout; account creation is not required for V1.
- Product catalog starts with seeded data, then can be managed through admin tooling later.
- R2 setup can wait until after database-backed product browsing and COD checkout are functional.

## References

- Supabase API security and RLS guidance: https://supabase.com/docs/guides/api/securing-your-api
- Supabase Storage access control guidance: https://supabase.com/docs/guides/storage/security/access-control
