"use client";

import { useEffect, useState } from "react";

export function StatusMessage({ status }: { status: string }) {
  const [isVisible, setIsVisible] = useState(true);
  const isError = status === "profile_error" || status === "rate_limited";

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
      {getStatusText(status)}
    </p>
  );
}

function getStatusText(status: string) {
  if (status === "rate_limited") {
    return "Too many updates. Wait a minute and try again.";
  }

  if (status === "profile_error") {
    return "Check your profile details and try again.";
  }

  return "Profile saved.";
}
