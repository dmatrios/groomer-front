// src/features/appointments/ui/appointmentStatusUI.ts
import type { AppointmentStatus } from "../api/appointmentsApi";

export const appointmentStatusUI: Record<
  AppointmentStatus,
  { label: string; variant: "scheduled" | "attended" | "cancelled" }
> = {
  PENDING: { label: "PENDIENTE", variant: "scheduled" },
  ATTENDED: { label: "ATENDIDA", variant: "attended" },
  CANCELED: { label: "CANCELADA", variant: "cancelled" },
};
