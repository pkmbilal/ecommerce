"use client";

import { useRef, useState } from "react";

type ProductStatusToggleProps = {
  action: string;
  isActive: boolean;
  productTitle: string;
};

export function ProductStatusToggle({
  action,
  isActive,
  productTitle,
}: ProductStatusToggleProps) {
  const [checked, setChecked] = useState(isActive);
  const isActiveInputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} method="post" className="flex items-center gap-2">
      <input type="hidden" name="intent" value="set-active" />
      <input
        ref={isActiveInputRef}
        type="hidden"
        name="isActive"
        value={String(checked)}
      />
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="sr-only">
          {checked ? "Disable" : "Enable"} {productTitle}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          aria-label={`${checked ? "Disable" : "Enable"} ${productTitle}`}
          className="peer sr-only"
          onChange={(event) => {
            const nextChecked = event.target.checked;
            setChecked(nextChecked);

            if (isActiveInputRef.current) {
              isActiveInputRef.current.value = String(nextChecked);
            }

            event.currentTarget.form?.requestSubmit();
          }}
        />
        <span className="relative h-6 w-11 rounded-full bg-gray-200 transition after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-3 peer-focus-visible:ring-brand-500/20" />
      </label>
    </form>
  );
}
