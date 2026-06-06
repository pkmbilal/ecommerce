import type { ReactNode } from "react";

export function AdminPanel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-white shadow-theme-sm ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-theme-sm">
      <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
        {icon}
      </div>
      <div className="mt-5">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        {note ? <p className="mt-2 text-xs text-gray-500">{note}</p> : null}
      </div>
    </div>
  );
}

export function AdminStatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  children: ReactNode;
}) {
  const classes = {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-500",
    danger: "bg-error-50 text-error-700",
    brand: "bg-brand-50 text-brand-500",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${classes[tone]}`}
    >
      {children}
    </span>
  );
}
