import { getR2PublicMediaHostname } from "@/lib/media/config";

const FALLBACK_MEDIA_HOSTNAMES = new Set(["images.unsplash.com"]);

export function resolveProductImageUrl(
  value: string | null | undefined,
  fallbackUrl: string,
): string {
  return isAllowedProductImageUrl(value) ? value.trim() : fallbackUrl;
}

export function isAllowedProductImageUrl(
  value: string | null | undefined,
): value is string {
  const parsed = parseHttpsUrl(value);

  if (!parsed) {
    return false;
  }

  if (FALLBACK_MEDIA_HOSTNAMES.has(parsed.hostname)) {
    return true;
  }

  const r2Hostname = getR2PublicMediaHostname();

  return Boolean(r2Hostname && parsed.hostname === r2Hostname);
}

function parseHttpsUrl(value: string | null | undefined): URL | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    return parsed.protocol === "https:" && parsed.hostname ? parsed : null;
  } catch {
    return null;
  }
}
