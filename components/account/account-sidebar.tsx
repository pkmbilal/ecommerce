"use client";

import {
  Boxes,
  ChevronDown,
  Grid3X3,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  accountNavItems,
  accountShoppingNavItems,
} from "@/components/account/account-nav-items";
import { useSidebar } from "@/components/admin/tailadmin/sidebar-context";

type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const navItems: NavItem[] = accountNavItems;
const supportItems: NavItem[] = accountShoppingNavItems;

export function AccountSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "support";
    index: number;
  } | null>(null);

  const isActive = (path: string) => {
    const [routePath] = path.split("?");

    return pathname === routePath;
  };

  const activeSubmenu = (() => {
    for (const menuType of ["main", "support"] as const) {
      const items = menuType === "main" ? navItems : supportItems;
      const index = items.findIndex((nav) =>
        nav.subItems?.some((subItem) => isActive(subItem.path)),
      );

      if (index >= 0) {
        return { type: menuType, index };
      }
    }

    return null;
  })();

  const effectiveOpenSubmenu = openSubmenu ?? activeSubmenu;
  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 ${
        showText ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !showText ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/account" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white">
            <Boxes className="size-5" />
          </span>
          {showText ? (
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold text-gray-900">
                SAHA Account
              </span>
              <span className="block truncate text-xs font-medium text-gray-500">
                Orders and saved shopping
              </span>
            </span>
          ) : null}
        </Link>
      </div>
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <MenuSection
              title="Menu"
              compact={!showText}
              icon={<Grid3X3 className="size-5" />}
            >
              {renderMenuItems(navItems, "main")}
            </MenuSection>
            <MenuSection
              title="Shopping"
              compact={!showText}
              icon={<ShoppingBag className="size-5" />}
            >
              {renderMenuItems(supportItems, "support")}
            </MenuSection>
          </div>
        </nav>
      </div>
    </aside>
  );

  function renderMenuItems(items: NavItem[], menuType: "main" | "support") {
    return (
      <ul className="flex flex-col gap-4">
        {items.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                type="button"
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  effectiveOpenSubmenu?.type === menuType &&
                  effectiveOpenSubmenu?.index === index
                    ? "bg-emerald-50 text-emerald-700"
                    : "menu-item-inactive"
                } cursor-pointer ${!showText ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span
                  className={
                    effectiveOpenSubmenu?.type === menuType &&
                    effectiveOpenSubmenu?.index === index
                      ? "text-emerald-700"
                      : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>
                {showText ? <span className="menu-item-text">{nav.name}</span> : null}
                {showText ? (
                  <ChevronDown
                    className={`ml-auto size-5 transition-transform duration-200 ${
                      effectiveOpenSubmenu?.type === menuType &&
                      effectiveOpenSubmenu?.index === index
                        ? "rotate-180 text-emerald-700"
                        : ""
                    }`}
                  />
                ) : null}
              </button>
            ) : nav.path ? (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path)
                    ? "bg-emerald-50 text-emerald-700"
                    : "menu-item-inactive"
                } ${!showText ? "lg:justify-center" : ""}`}
              >
                <span
                  className={isActive(nav.path) ? "text-emerald-700" : "menu-item-icon-inactive"}
                >
                  {nav.icon}
                </span>
                {showText ? <span className="menu-item-text">{nav.name}</span> : null}
              </Link>
            ) : null}
            {nav.subItems && showText ? (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  effectiveOpenSubmenu?.type === menuType &&
                  effectiveOpenSubmenu?.index === index
                    ? "max-h-48"
                    : "max-h-0"
                }`}
              >
                <ul className="ml-9 mt-2 space-y-1">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "bg-emerald-50 text-emerald-700"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  function handleSubmenuToggle(index: number, menuType: "main" | "support") {
    setOpenSubmenu((current) =>
      (current ?? effectiveOpenSubmenu)?.type === menuType &&
      (current ?? effectiveOpenSubmenu)?.index === index
        ? null
        : { type: menuType, index },
    );
  }
}

function MenuSection({
  title,
  compact,
  icon,
  children,
}: {
  title: string;
  compact: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <h2
        className={`mb-4 flex text-xs uppercase leading-5 text-gray-400 ${
          compact ? "lg:justify-center" : "justify-start"
        }`}
      >
        {compact ? icon : title}
      </h2>
      {children}
    </div>
  );
}
