"use client";

import { useEffect } from "react";

const CREATE_PRODUCT_DRAFT_KEY = "admin:create-product-form-draft";

type DraftValue = string | boolean;

export function ProductFormDraft({ restore }: { restore: boolean }) {
  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(
      "form[data-product-form='create']",
    );

    if (!form) {
      return;
    }

    if (restore) {
      restoreDraft(form);
    } else {
      window.localStorage.removeItem(CREATE_PRODUCT_DRAFT_KEY);
    }

    const saveDraft = () => {
      window.localStorage.setItem(
        CREATE_PRODUCT_DRAFT_KEY,
        JSON.stringify(readDraft(form)),
      );
    };

    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);

    return () => {
      form.removeEventListener("input", saveDraft);
      form.removeEventListener("change", saveDraft);
    };
  }, [restore]);

  return null;
}

function readDraft(form: HTMLFormElement) {
  const draft: Record<string, DraftValue> = {};
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input[name], select[name], textarea[name]",
  );

  fields.forEach((field) => {
    if (field instanceof HTMLInputElement && field.type === "file") {
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      if (field.checked) {
        draft[field.name] = field.value;
      }

      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      draft[field.name] = field.checked;
      return;
    }

    draft[field.name] = field.value;
  });

  return draft;
}

function restoreDraft(form: HTMLFormElement) {
  const rawDraft = window.localStorage.getItem(CREATE_PRODUCT_DRAFT_KEY);

  if (!rawDraft) {
    return;
  }

  let draft: Record<string, DraftValue>;

  try {
    draft = JSON.parse(rawDraft) as Record<string, DraftValue>;
  } catch {
    window.localStorage.removeItem(CREATE_PRODUCT_DRAFT_KEY);
    return;
  }

  Object.entries(draft).forEach(([name, value]) => {
    const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      `[name="${CSS.escape(name)}"]`,
    );

    fields.forEach((field) => {
      if (field instanceof HTMLInputElement && field.type === "file") {
        return;
      }

      if (field instanceof HTMLInputElement && field.type === "radio") {
        field.checked = field.value === value;
        return;
      }

      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = value === true;
        return;
      }

      field.value = String(value);
    });
  });
}
