# Cloudflare R2 Media Setup

This project is ready to read product media from a public Cloudflare R2-backed
host, but it does not require an R2 bucket for local development yet. Existing
Unsplash seed images remain allowed as fallback data until the catalog media is
migrated.

## Environment Variables

Set one of these public host values when the R2 bucket or custom domain is
ready:

```env
R2_PUBLIC_MEDIA_HOST=media.example.com
R2_PUBLIC_MEDIA_BASE_URL=https://media.example.com
```

`R2_PUBLIC_MEDIA_HOST` is enough for `next/image` remote pattern allowlisting.
`R2_PUBLIC_MEDIA_BASE_URL` is useful for future upload or URL-building helpers.
Both values must resolve to an HTTPS hostname.

These values are reserved for the later upload/admin milestone:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

Keep the access key and secret server-only. Do not expose them through
`NEXT_PUBLIC_` variables.

## Current Behavior

- `next/image` allows `images.unsplash.com` for the current seed catalog.
- When `R2_PUBLIC_MEDIA_HOST` or `R2_PUBLIC_MEDIA_BASE_URL` is set, that exact
  HTTPS hostname is also allowed.
- Product and cart image URLs from Supabase are validated before rendering. If a
  URL is missing, not HTTPS, or not from an allowed media host, the app uses the
  existing fallback product image.

## Later Migration Work

- Create the R2 bucket and custom public domain.
- Upload product and category media into a stable folder layout.
- Update `product_images.url` rows to the R2-backed URLs.
- Add admin upload controls only after server-side authorization and file
  validation are in place.
