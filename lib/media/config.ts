const HTTPS_PROTOCOL = "https:";

export function getR2PublicMediaHostname(): string | null {
  return getHostnameFromEnvValue(
    process.env.R2_PUBLIC_MEDIA_HOST,
    process.env.R2_PUBLIC_MEDIA_BASE_URL,
  );
}

export function getR2PublicMediaBaseUrl(): string | null {
  const explicitBaseUrl = normalizeHttpsBaseUrl(
    process.env.R2_PUBLIC_MEDIA_BASE_URL,
  );

  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const hostname = getHostnameFromEnvValue(process.env.R2_PUBLIC_MEDIA_HOST);

  return hostname ? `https://${hostname}` : null;
}

export function isR2MediaConfigured(): boolean {
  return Boolean(getR2PublicMediaHostname());
}

function getHostnameFromEnvValue(
  ...values: Array<string | undefined>
): string | null {
  for (const value of values) {
    const hostname = getHostname(value);

    if (hostname) {
      return hostname;
    }
  }

  return null;
}

function getHostname(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );

    if (url.protocol !== HTTPS_PROTOCOL || !url.hostname) {
      return null;
    }

    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeHttpsBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== HTTPS_PROTOCOL || !url.hostname) {
      return null;
    }

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
