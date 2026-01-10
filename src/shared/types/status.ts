// Estados del backend (copiados tal cual)
export type AppointmentStatus = "PROGRAMADA" | "ATENDIDA" | "CANCELADA";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";

// Mapeo a UI
export const appointmentStatusUI = {
  PROGRAMADA: { label: "Programada", variant: "scheduled" },
  ATENDIDA: { label: "Atendida", variant: "attended" },
  CANCELADA: { label: "Cancelada", variant: "cancelled" },
} as const;

export const paymentStatusUI = {
  PENDING: { label: "Pendiente", variant: "pending" },
  PARTIAL: { label: "Parcial", variant: "partial" },
  PAID: { label: "Pagado", variant: "paid" },
} as const;
