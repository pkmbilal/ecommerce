import type { NextConfig } from "next";

function getOptionalHttpsHostname(
  ...values: Array<string | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const url = new URL(
        trimmed.includes("://") ? trimmed : `https://${trimmed}`,
      );

      if (url.protocol === "https:" && url.hostname) {
        return url.hostname.toLowerCase();
      }
    } catch {
      continue;
    }
  }

  return null;
}

const r2MediaHostname = getOptionalHttpsHostname(
  process.env.R2_PUBLIC_MEDIA_HOST,
  process.env.R2_PUBLIC_MEDIA_BASE_URL,
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(r2MediaHostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2MediaHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
