import {
  Heart,
  Home,
  MapPin,
  PackageCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

export type AccountNavItem = {
  name: string;
  icon: ReactNode;
  path: string;
};

export const accountNavItems: AccountNavItem[] = [
  {
    icon: <Home className="size-5" />,
    name: "Overview",
    path: "/account",
  },
  {
    icon: <UserRound className="size-5" />,
    name: "Profile",
    path: "/account/profile",
  },
  {
    icon: <MapPin className="size-5" />,
    name: "Addresses",
    path: "/account/addresses",
  },
  {
    icon: <Heart className="size-5" />,
    name: "Favorites",
    path: "/account/favorites",
  },
  {
    icon: <PackageCheck className="size-5" />,
    name: "Orders",
    path: "/account/orders",
  },
];

export const accountShoppingNavItems: AccountNavItem[] = [
  {
    icon: <ShoppingBag className="size-5" />,
    name: "Storefront",
    path: "/products",
  },
];
