import type { ReactNode } from "react";

import { TailAdminLayout } from "@/components/admin/tailadmin/layout";

type TailAdminShellProps = {
  profile: {
    email: string;
    fullName?: string;
  };
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function TailAdminShell({
  profile,
  title,
  subtitle,
  actions,
  children,
}: TailAdminShellProps) {
  return (
    <TailAdminLayout profile={profile}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">Admin workspace</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </TailAdminLayout>
  );
}
