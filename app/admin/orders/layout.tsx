import type { ReactNode } from "react";

import { requireAdminSession } from "@/lib/admin/auth";

export default async function AdminOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return <>{children}</>;
}
