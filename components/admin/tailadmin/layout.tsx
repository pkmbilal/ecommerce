"use client";

// Adapted from TailAdmin free-nextjs-admin-dashboard (MIT).
import type { ReactNode } from "react";

import { TailAdminBackdrop } from "@/components/admin/tailadmin/backdrop";
import { TailAdminHeader } from "@/components/admin/tailadmin/app-header";
import { TailAdminSidebar } from "@/components/admin/tailadmin/app-sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/admin/tailadmin/sidebar-context";

type TailAdminLayoutProps = {
  profile: {
    email: string;
    fullName?: string;
  };
  children: ReactNode;
};

export function TailAdminLayout({ profile, children }: TailAdminLayoutProps) {
  return (
    <SidebarProvider>
      <TailAdminLayoutInner profile={profile}>{children}</TailAdminLayoutInner>
    </SidebarProvider>
  );
}

function TailAdminLayoutInner({ profile, children }: TailAdminLayoutProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-gray-50 xl:flex">
      <TailAdminSidebar />
      <TailAdminBackdrop />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <TailAdminHeader email={profile.email} fullName={profile.fullName} />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
