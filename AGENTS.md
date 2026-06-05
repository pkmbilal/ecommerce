<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project uses Next.js 16, which includes breaking changes to APIs, routing,
caching, and conventions. Before writing or changing code, read the relevant
guide in `node_modules/next/dist/docs/` and follow deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ecommerce Engineering Rules

## Project Defaults

- Build a single-vendor ecommerce store for Saudi Arabia.
- Use Next.js `16.2.7`, App Router, React `19.2.4`, TypeScript, and Tailwind CSS 4.
- Use Supabase for database, auth, and server-side data access.
- Use Cloudflare R2 for product and media storage.
- V1 supports cash on delivery only. Do not add online payment, wallet, card,
  payment gateway, or webhook flows unless explicitly requested.
- UI is English-first, but code and layout decisions must not block future
  Arabic and RTL support.
- Prices are in SAR. Design money, tax, and totals with Saudi VAT readiness.

## Architecture Principles

- Prefer React Server Components by default. Add `"use client"` only for state,
  event handlers, browser APIs, or client-only libraries.
- Keep domain logic out of UI components. UI components render state; services
  calculate prices, validate inventory, create orders, and perform persistence.
- Keep modules small and purpose-specific. Prefer clear domain boundaries over
  generic utility dumping grounds.
- Recommended boundaries:
  - `app/` for routes, layouts, loading states, and route handlers.
  - Shared UI components for reusable presentational pieces.
  - Domain services for product, cart, checkout, order, inventory, customer, and
    delivery behavior.
  - Supabase clients and queries isolated from UI.
  - R2/media helpers isolated from UI.
  - Validation schemas isolated and reused at every external input boundary.
- Do not introduce abstractions until they remove real duplication or clarify a
  domain boundary.
- Use TypeScript strictly. Avoid `any`; if unavoidable, contain it at the
  boundary and narrow immediately.

## Ecommerce Domain Rules

- Product, cart, checkout, order, inventory, customer, and delivery flows must be
  treated as separate domains.
- Never trust client-side prices, discounts, stock, shipping fees, tax values, or
  order totals.
- Recalculate all final totals server-side before creating an order.
- Store money as integers in the smallest currency unit. Do not use floating
  point arithmetic for money.
- Keep product reads paginated. Never load the full catalog into memory for
  listing, search, category pages, or admin tables.
- Use stable product and order identifiers. Do not expose database assumptions
  through UI copy or URLs unless intentionally designed.
- Inventory changes must be explicit and auditable. Use idempotency for order
  placement and inventory reservation.

## Cash on Delivery Rules

- Checkout creates a COD order only after server-side validation succeeds.
- Required checkout data for V1:
  - Customer name.
  - Saudi phone number.
  - Delivery address.
  - City or region.
  - Cart items and quantities.
  - Optional order notes.
- Recommended order statuses:
  - `pending_confirmation`
  - `confirmed`
  - `out_for_delivery`
  - `delivered`
  - `cancelled`
- Reserve or decrement inventory only after successful server-side order
  creation.
- Admin/order-management flows must support confirming, cancelling, and marking
  COD orders as delivered when those flows are implemented.
- Cancellation must release inventory when inventory was reserved.
- Delivered COD orders should be treated as collected revenue only when marked
  delivered or otherwise confirmed by an admin workflow.

## Saudi Arabia Requirements

- Display prices in SAR clearly.
- Prepare tax logic for Saudi VAT, currently expected to be 15%, but do not
  hardcode business-critical tax behavior in scattered UI components.
- Keep phone, address, city, and delivery fields suitable for Saudi customers.
- Keep layout and component choices compatible with future RTL support.
- Do not bake English-only assumptions into domain models.

## Supabase Rules

- Privileged Supabase access must be server-only.
- Never expose Supabase service role keys or other secrets to the browser.
- Use Row Level Security intentionally. If a query depends on an RLS policy,
  document the assumption near the data access layer or migration.
- Validate all user-provided data before calling Supabase.
- Keep database queries in dedicated data-access modules or services, not mixed
  into reusable presentational components.
- Design writes for concurrency. Checkout and inventory updates must avoid
  double-submission and overselling.

## Cloudflare R2 Rules

- Product and marketing media should be stored in Cloudflare R2 or served from
  approved static assets.
- Use `next/image` for rendered images unless there is a specific reason not to.
- Configure image remote patterns for R2-backed media instead of broad host
  allowlists.
- Use responsive image sizing and meaningful alt text for product images.
- Treat media URLs and metadata as untrusted external data until validated.

## Performance and Scaling

- Use Next.js App Router features deliberately: layouts, loading states,
  streaming, caching, and Server Components.
- Do not assume `fetch` requests are cached by default in this Next.js version.
  Read the local caching docs before changing data-fetching behavior.
- Add loading states for product listing, product detail, cart, checkout, and
  admin/order screens as they are implemented.
- Avoid unnecessary client-side JavaScript. Keep filters, sorting, and search
  server-driven unless client interactivity is clearly needed.
- Use pagination or cursor-based loading for product, order, customer, and admin
  lists.
- Avoid N+1 query patterns. Batch related reads where appropriate.
- Keep expensive work out of request paths unless cached or deferred.
- Prefer deterministic cache invalidation for product, inventory, and order data
  when these flows are implemented.

## Security and Reliability

- Validate all external input with schemas before using it.
- Treat all browser data as untrusted.
- Protect admin and order-management operations with server-side authorization.
- Use structured errors. Do not leak secrets, tokens, stack traces, or internal
  database details to users.
- Add rate limiting for checkout, auth, search, and other abuse-prone endpoints
  when those endpoints are implemented.
- Use idempotency keys or equivalent safeguards for order creation and inventory
  reservation.
- Avoid destructive migrations or data changes without an explicit rollback plan.
- Keep environment variables server-only unless they are intentionally public and
  prefixed for client exposure.

## Frontend and UX

- Use the Shopco reference as the visual direction for the storefront:
  - Reference repo: `https://github.com/mohammadoftadeh/next-ecommerce-shopco`
  - Live demo: `https://next-ecommerce-shopco.vercel.app/`
- Treat Shopco as visual inspiration, not as architecture to copy. Its stack is
  older than this project. Do not import its Next.js 14, Tailwind 3, or Redux
  assumptions without revalidating them against this project's Next.js 16,
  React 19, Tailwind 4, Supabase, R2, and COD-only rules.
- Recreate the Shopco-style ecommerce feel with fresh code for this project:
  - Promo top bar.
  - Header with brand, navigation, search, cart, and account affordances.
  - Bold hero section with strong product/storefront imagery.
  - Featured brand or collection strip.
  - Product sections such as new arrivals, best sellers, and promotions.
  - Product cards with image, title, rating, SAR price, optional compare-at
    price, discount badge, and quick add behavior.
  - Category tiles, review/testimonial sections, newsletter area, and footer.
- Use selective shadcn-style primitives for forms, dialogs, sheets/drawers,
  selects, accordions, separators, sliders, and other accessible controls.
  Configure them for Tailwind CSS 4 and React 19; do not copy an old
  `tailwind.config.ts` from the reference repo.
- Use Motion for React for polished interactions when useful:
  - Hero entrance.
  - Product-card hover.
  - Cart drawer transitions.
  - Section reveal.
  - Small feedback transitions.
- Keep animated components client-only and small. Respect reduced-motion
  preferences and avoid animation that delays shopping tasks.
- Do not add Redux Toolkit just because Shopco uses it. Use the smallest cart
  state approach that fits this project, and keep server-side COD order creation
  as the source of truth.
- Build the actual shopping experience, not a marketing landing page, unless
  explicitly requested.
- Product browsing, product details, cart, checkout, and order confirmation
  should be usable on mobile first.
- Use accessible controls, semantic HTML, keyboard-friendly interactions, and
  meaningful labels.
- Do not use oversized decorative UI that reduces ecommerce usability.
- Keep layout dense enough for shopping and scanning, while preserving clear
  hierarchy.
- Use icons where helpful for common ecommerce actions, but keep commands clear.
- Prevent text overflow and incoherent overlap across mobile and desktop
  viewports.

## Testing and Verification

- Before finishing code changes, run:
  - `npm run lint`
  - `npm run build`
- Add targeted tests when domain logic exists, especially for:
  - Money formatting and integer money arithmetic.
  - VAT calculation.
  - Cart totals.
  - Inventory reservation and release.
  - COD order creation.
  - Order status transitions.
  - Server-side validation.
- For UI changes, manually verify mobile and desktop behavior.
- For performance-sensitive changes, check bundle impact and avoid moving server
  logic into client components.

## Prohibited Shortcuts

- Do not add online payment flows for V1.
- Do not trust client-calculated order totals.
- Do not use floating point arithmetic for money.
- Do not expose service role keys or privileged Supabase clients to the browser.
- Do not load full product or order tables into memory.
- Do not skip lint/build verification after code changes.
- Do not ignore Next.js 16 local docs when changing routing, caching, server
  actions, route handlers, metadata, images, or configuration.
