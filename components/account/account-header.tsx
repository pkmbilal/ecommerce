"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  accountNavItems,
  accountShoppingNavItems,
} from "@/components/account/account-nav-items";
import { useSidebar } from "@/components/admin/tailadmin/sidebar-context";

type AccountHeaderProps = {
  email: string;
  fullName?: string;
  avatarUrl?: string;
};

export function AccountHeader({ email, fullName, avatarUrl }: AccountHeaderProps) {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const displayName = fullName || email;
  const initials = getInitials(displayName, email);

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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        profileMenuRef.current &&
        event.target instanceof Node &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
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
          <div className="relative w-fit max-w-full" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              className="group flex h-14 w-fit max-w-full min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2.5 text-left shadow-theme-xs transition hover:border-emerald-200 hover:bg-emerald-50/40 focus:outline-none focus:ring-3 focus:ring-emerald-700/10"
            >
              <AvatarImage
                avatarUrl={avatarUrl}
                displayName={displayName}
                initials={initials}
              />
              <span className="min-w-0 max-w-[160px] sm:max-w-[190px]">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {displayName}
                </span>
                <span className="block truncate text-xs font-medium text-gray-500">
                  {email}
                </span>
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-gray-400 transition group-hover:text-emerald-700 ${
                  isProfileMenuOpen ? "rotate-180 text-emerald-700" : ""
                }`}
              />
            </button>

            {isProfileMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-md"
              >
                <div className="border-b border-gray-100 bg-[#fbfaf7] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarImage
                      avatarUrl={avatarUrl}
                      displayName={displayName}
                      initials={initials}
                      large
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {displayName}
                      </p>
                      <p className="truncate text-xs font-medium text-gray-500">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="grid gap-1 p-2" aria-label="Account menu">
                  {[...accountNavItems, ...accountShoppingNavItems].map((item) => {
                    const isActive = pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span
                          className={isActive ? "text-emerald-700" : "text-gray-500"}
                        >
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                <form action="/api/auth/logout" method="post" className="border-t border-gray-100 p-2">
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-error-700 transition hover:bg-error-50"
                  >
                    <LogOut className="size-5" />
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function AvatarImage({
  avatarUrl,
  displayName,
  initials,
  large = false,
}: {
  avatarUrl?: string;
  displayName: string;
  initials: string;
  large?: boolean;
}) {
  const size = large ? "size-12" : "size-10";

  return (
    <span
      className={`${size} relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-900 text-sm font-bold text-white shadow-theme-xs`}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${displayName} profile image`}
          fill
          sizes={large ? "48px" : "40px"}
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

function getInitials(name: string, email: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const source = parts[0] || email;

  return source.slice(0, 2).toUpperCase();
}
