import type { ReactNode } from "react";

import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return <>{children}</>;
}
