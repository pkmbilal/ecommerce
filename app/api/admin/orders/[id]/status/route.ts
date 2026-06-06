import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin/auth";
import {
  type AdminOrderStatus,
  transitionAdminOrderStatus,
} from "@/lib/admin/orders";

const allowedStatuses = new Set<AdminOrderStatus>([
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

type StatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: StatusRouteContext) {
  if (!(await hasAdminSession())) {
    return NextResponse.redirect(new URL("/login?next=/admin/orders", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const nextStatus = formData.get("nextStatus");

  if (typeof nextStatus !== "string" || !isKnownStatus(nextStatus)) {
    return NextResponse.redirect(new URL("/admin/orders", request.url), {
      status: 303,
    });
  }

  const { id } = await context.params;
  await transitionAdminOrderStatus(id, nextStatus);

  return NextResponse.redirect(new URL(`/admin/orders/${id}`, request.url), {
    status: 303,
  });
}

function isKnownStatus(value: string): value is AdminOrderStatus {
  return allowedStatuses.has(value as AdminOrderStatus);
}
