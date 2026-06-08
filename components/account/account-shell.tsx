import type { ReactNode } from "react";

import { AccountLayout } from "@/components/account/account-layout";

type AccountShellProps = {
  profile: {
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AccountShell({
  profile,
  title,
  subtitle,
  actions,
  children,
}: AccountShellProps) {
  return (
    <AccountLayout profile={profile}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Customer workspace</p>
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
    </AccountLayout>
  );
}
