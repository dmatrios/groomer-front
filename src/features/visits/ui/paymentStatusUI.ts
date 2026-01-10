import type { PaymentStatus } from "@/features/visits/api/visitsApi";

export const paymentStatusUI: Record<
  PaymentStatus,
  { label: string; variant: "pending" | "partial" | "paid" }
> = {
  PENDING: { label: "Pendiente", variant: "pending" },
  PARTIAL: { label: "Parcial", variant: "partial" },
  PAID: { label: "Pagado", variant: "paid" },
};
