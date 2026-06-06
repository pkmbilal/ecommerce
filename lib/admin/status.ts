import type { AdminOrderStatus } from "@/lib/admin/orders";

export function formatStatus(status: AdminOrderStatus) {
  return status.replaceAll("_", " ");
}

export function getStatusTone(status: AdminOrderStatus) {
  switch (status) {
    case "delivered":
      return "success";
    case "pending_confirmation":
      return "warning";
    case "cancelled":
      return "danger";
    case "confirmed":
    case "out_for_delivery":
      return "brand";
    default:
      return "neutral";
  }
}
