type RateLimitRule = {
  name: string;
  maxAttempts: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  buckets: Map<string, RateLimitBucket>;
  lastCleanupAt: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __sahaRateLimitStore?: RateLimitStore;
};

const store =
  globalRateLimitStore.__sahaRateLimitStore ??
  (globalRateLimitStore.__sahaRateLimitStore = {
    buckets: new Map<string, RateLimitBucket>(),
    lastCleanupAt: Date.now(),
  });

const CLEANUP_INTERVAL_MS = 60_000;

export const rateLimitRules = {
  login: {
    name: "auth-login",
    maxAttempts: 5,
    windowMs: 60_000,
  },
  signup: {
    name: "auth-signup",
    maxAttempts: 3,
    windowMs: 60 * 60_000,
  },
  checkout: {
    name: "checkout",
    maxAttempts: 3,
    windowMs: 60_000,
  },
  cartWrite: {
    name: "cart-write",
    maxAttempts: 30,
    windowMs: 60_000,
  },
  cartSummary: {
    name: "cart-summary",
    maxAttempts: 60,
    windowMs: 60_000,
  },
  adminMutation: {
    name: "admin-mutation",
    maxAttempts: 20,
    windowMs: 60_000,
  },
  accountMutation: {
    name: "account-mutation",
    maxAttempts: 20,
    windowMs: 60_000,
  },
} satisfies Record<string, RateLimitRule>;

export function checkRateLimit({
  request,
  rule,
  subject,
}: {
  request: Request;
  rule: RateLimitRule;
  subject?: string;
}): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = [
    rule.name,
    normalizeRateLimitKey(subject),
    getClientIp(request),
  ].join(":");
  const current = store.buckets.get(key);
  const bucket =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + rule.windowMs,
        };

  bucket.count += 1;
  store.buckets.set(key, bucket);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.resetAt - now) / 1000),
  );
  const remaining = Math.max(rule.maxAttempts - bucket.count, 0);

  return {
    allowed: bucket.count <= rule.maxAttempts,
    limit: rule.maxAttempts,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitedJson(
  result: RateLimitResult,
  message = "Too many requests. Try again shortly.",
) {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

export function rateLimitedRedirect({
  request,
  path,
  result,
  statusParam = "error",
  statusValue = "rate_limited",
}: {
  request: Request;
  path: string;
  result: RateLimitResult;
  statusParam?: string;
  statusValue?: string;
}) {
  const url = new URL(path, request.url);
  url.searchParams.set(statusParam, statusValue);

  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      ...rateLimitHeaders(result),
    },
  });
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  ).toLowerCase();
}

export function resetRateLimitForTests() {
  store.buckets.clear();
  store.lastCleanupAt = Date.now();
}

function cleanupExpiredBuckets(now: number) {
  if (now - store.lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of store.buckets) {
    if (bucket.resetAt <= now) {
      store.buckets.delete(key);
    }
  }

  store.lastCleanupAt = now;
}

function normalizeRateLimitKey(value: string | undefined) {
  return value?.trim().toLowerCase().replaceAll(/\s+/g, "-") || "anonymous";
}
