"use client";

import { useEffect, useState } from "react";

export function StatusMessage({ status }: { status: string }) {
  const [isVisible, setIsVisible] = useState(true);
  const isError = status === "profile_error";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  if (!isVisible) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-lg p-3 text-sm font-semibold transition-opacity duration-200 ${
        isError ? "bg-error-50 text-error-700" : "bg-success-50 text-success-700"
      }`}
    >
      {isError ? "Check your profile details and try again." : "Profile saved."}
    </p>
  );
}
