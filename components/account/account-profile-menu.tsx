"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  accountNavItems,
  accountShoppingNavItems,
} from "@/components/account/account-nav-items";

type AccountProfileMenuProps = {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  variant?: "bar" | "avatar";
};

export function AccountProfileMenu({
  email,
  fullName,
  avatarUrl,
  variant = "bar",
}: AccountProfileMenuProps) {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const displayName = fullName || email;
  const initials = getInitials(displayName, email);
  const isAvatarOnly = variant === "avatar";

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

  return (
    <div
      className={
        isAvatarOnly
          ? "relative flex size-10 shrink-0 items-center justify-center"
          : "relative w-fit max-w-full"
      }
      ref={profileMenuRef}
    >
      <button
        type="button"
        onClick={() => setProfileMenuOpen((current) => !current)}
        aria-label={`Account menu for ${displayName}`}
        aria-expanded={isProfileMenuOpen}
        aria-haspopup="menu"
        className={
          isAvatarOnly
            ? "group relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-300 bg-white/80 p-0 leading-none transition hover:border-zinc-950 focus:outline-none focus:ring-3 focus:ring-emerald-700/10"
            : "group flex h-14 w-fit max-w-full min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2.5 text-left shadow-theme-xs transition hover:border-emerald-200 hover:bg-emerald-50/40 focus:outline-none focus:ring-3 focus:ring-emerald-700/10"
        }
      >
        <AvatarImage
          avatarUrl={avatarUrl}
          displayName={displayName}
          initials={initials}
          compact={isAvatarOnly}
        />
        {isAvatarOnly ? null : (
          <>
            <span className="hidden min-w-0 max-w-[160px] sm:block sm:max-w-[190px]">
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
          </>
        )}
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
  );
}

function AvatarImage({
  avatarUrl,
  displayName,
  initials,
  large = false,
  compact = false,
}: {
  avatarUrl?: string;
  displayName: string;
  initials: string;
  large?: boolean;
  compact?: boolean;
}) {
  const size = large ? "size-12" : compact ? "size-full" : "size-10";

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
