"use client";

// Adapted from TailAdmin free-nextjs-admin-dashboard (MIT).
import { useSidebar } from "@/components/admin/tailadmin/sidebar-context";

export function TailAdminBackdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Close admin navigation"
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
}
