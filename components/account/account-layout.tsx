"use client";

import type { ReactNode } from "react";

import { AccountHeader } from "@/components/account/account-header";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { TailAdminBackdrop } from "@/components/admin/tailadmin/backdrop";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/admin/tailadmin/sidebar-context";

type AccountLayoutProps = {
  profile: {
    email: string;
    fullName?: string;
  };
  children: ReactNode;
};

export function AccountLayout({ profile, children }: AccountLayoutProps) {
  return (
    <SidebarProvider>
      <AccountLayoutInner profile={profile}>{children}</AccountLayoutInner>
    </SidebarProvider>
  );
}

function AccountLayoutInner({ profile, children }: AccountLayoutProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-[#fbfaf7] xl:flex">
      <AccountSidebar />
      <TailAdminBackdrop />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AccountHeader email={profile.email} fullName={profile.fullName} />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
