"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  form?: string;
  message: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  form,
  message,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      form={form}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
