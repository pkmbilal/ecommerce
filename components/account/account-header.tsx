"use client";

import {
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AccountProfileMenu } from "@/components/account/account-profile-menu";
import { useSidebar } from "@/components/admin/tailadmin/sidebar-context";

type AccountHeaderProps = {
  email: string;
  fullName?: string;
  avatarUrl?: string;
};

export function AccountHeader({ email, fullName, avatarUrl }: AccountHeaderProps) {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleToggle() {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex w-full border-gray-200 bg-white lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            type="button"
            className="z-30 flex size-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:size-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle account navigation"
          >
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link href="/account" className="font-bold text-gray-900 lg:hidden">
            SAHA Account
          </Link>

          <button
            type="button"
            onClick={() => setApplicationMenuOpen((current) => !current)}
            className="z-30 flex size-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle account menu"
          >
            <MoreHorizontal className="size-5" />
          </button>

          <div className="hidden lg:block">
            <form action="/products">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search className="size-5" />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  placeholder="Search products..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-20 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-700/10 xl:w-[430px]"
                />
                <span className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500">
                  Ctrl K
                </span>
              </div>
            </form>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-end gap-4 px-4 py-4 shadow-theme-md sm:px-5 lg:flex lg:px-0 lg:shadow-none`}
        >
          <AccountProfileMenu
            email={email}
            fullName={fullName}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
