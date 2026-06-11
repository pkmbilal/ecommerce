const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success?: unknown;
  "error-codes"?: unknown;
};

export type TurnstileVerificationResult =
  | {
      success: true;
    }
  | {
      success: false;
      errorCodes: string[];
    };

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
}: {
  token: string | undefined;
  remoteIp: string;
}): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secretKey || !token) {
    return {
      success: false,
      errorCodes: ["missing-input"],
    };
  }

  const formData = new FormData();
  formData.set("secret", secretKey);
  formData.set("response", token);
  formData.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        errorCodes: ["siteverify-unavailable"],
      };
    }

    return parseTurnstileVerificationResponse(await response.json());
  } catch {
    return {
      success: false,
      errorCodes: ["siteverify-unavailable"],
    };
  }
}

export function parseTurnstileVerificationResponse(
  value: unknown,
): TurnstileVerificationResult {
  if (!value || typeof value !== "object") {
    return {
      success: false,
      errorCodes: ["invalid-response"],
    };
  }

  const response = value as TurnstileResponse;

  if (response.success === true) {
    return { success: true };
  }

  return {
    success: false,
    errorCodes: parseErrorCodes(response["error-codes"]),
  };
}

function parseErrorCodes(value: unknown) {
  if (!Array.isArray(value)) {
    return ["verification-failed"];
  }

  const errorCodes = value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );

  return errorCodes.length > 0 ? errorCodes : ["verification-failed"];
}
