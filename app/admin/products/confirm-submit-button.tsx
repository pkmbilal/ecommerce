"use client";

import { useId, useRef, useState, type ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className?: string;
  form?: string;
  message: string;
  title?: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  form,
  message,
  title = "Confirm action",
}: ConfirmSubmitButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    setIsOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  function submitConfirmed() {
    closeDialog();

    const targetForm = form
      ? document.getElementById(form)
      : dialogRef.current?.closest("form");

    if (targetForm instanceof HTMLFormElement) {
      targetForm.requestSubmit();
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={openDialog}>
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed inset-0 m-auto w-[min(92vw,420px)] rounded-lg border border-gray-200 bg-white p-0 text-left shadow-theme-md backdrop:bg-gray-900/45"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={() => setIsOpen(false)}
      >
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-gray-500">
            {message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/20"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-error-500 px-4 text-sm font-semibold text-white hover:bg-error-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-error-500/20"
              onClick={submitConfirmed}
              autoFocus={isOpen}
            >
              Confirm
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
