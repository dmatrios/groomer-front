import { httpRequest } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

/* =====================
 * Enums / Types base
 * ===================== */

export type VisitItemCategory = "BATH" | "HAIRCUT" | "TREATMENT" | "OTHER";

export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID";

/**
 * ✅ Alineado al backend (enum PaymentMethod):
 * - CASH
 * - CARD
 * - MOBILE_BANKING (Yape/Plin/Transfer agrupado)
 */
export type PaymentMethod = "CASH" | "CARD" | "MOBILE_BANKING";

/* =====================
 * Requests
 * ===================== */

export type TreatmentDetailRequest = {
  treatmentTypeId: number | null;
  treatmentTypeText: string | null;
  medicineId: number | null;
  medicineText: string | null;
  nextDate: string | null; // YYYY-MM-DD
};

export type VisitItemRequest = {
  category: VisitItemCategory;
  price: number;
  treatmentDetail: TreatmentDetailRequest | null;
};

export type PaymentRequest = {
  status: PaymentStatus;
  method: PaymentMethod | null;
  amountPaid: number | null;
};

/**
 * ✅ autoCreateAppointment (walk-in premium)
 */
export type VisitCreateRequest = {
  petId: number;
  appointmentId: number | null;
  autoCreateAppointment?: boolean | null;

  visitedAt: string; // ISO "YYYY-MM-DDTHH:mm:ss"
  notes: string | null;
  items: VisitItemRequest[];
  payment: PaymentRequest | null;
};

export type VisitUpdateRequest = {
  visitedAt: string;
  notes: string | null;
  items: VisitItemRequest[];
  payment: PaymentRequest | null;
};

/* =====================
 * Responses
 * ===================== */

export type TreatmentDetailResponse = {
  treatmentTypeId: number | null;
  treatmentTypeText: string | null;
  medicineId: number | null;
  medicineText: string | null;
  nextDate: string | null;
};

export type VisitItemResponse = {
  detail: any;
  id: number;
  category: VisitItemCategory;
  price: number;
  treatmentDetail: TreatmentDetailResponse | null;
};

export type PaymentResponse = {
  status: PaymentStatus;
  method: PaymentMethod | null;
  amountPaid: number | null;
  balance: number;
};

/**
 * ✅ VisitDetailResponse
 * - petName viene ya desde backend (por rango y por mascota)
 */
export type VisitDetailResponse = {
  id: number;

  petId: number;
  petName?: string | null;

  appointmentId: number | null;
  visitedAt: string;
  totalAmount: number;
  notes: string | null;

  items: VisitItemResponse[];
  payment: PaymentResponse | null;
};

/* =====================
 * Helpers
 * ===================== */

function toIsoParam(value: string) {
  return encodeURIComponent(value);
}

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  return qs ? `?${qs}` : "";
}

/* =====================
 * API
 * ===================== */

export const visitsApi = {
  create: (body: VisitCreateRequest) =>
    httpRequest<ApiResponse<VisitDetailResponse>>(`/visits`, {
      method: "POST",
      body,
    }),

  getById: (id: number) =>
    httpRequest<ApiResponse<VisitDetailResponse>>(`/visits/${id}`),

  update: (id: number, body: VisitUpdateRequest) =>
    httpRequest<ApiResponse<VisitDetailResponse>>(`/visits/${id}`, {
      method: "PUT",
      body,
    }),

  /**
   * ✅ Historial por mascota
   * - category opcional (BATH | TREATMENT | OTHER)
   * - si no se envía, backend devuelve todo
   */
  listByPet: (petId: number, category?: VisitItemCategory) =>
    httpRequest<ApiResponse<VisitDetailResponse[]>>(
      `/visits${buildQuery({ petId, category: category ?? undefined })}`
    ),

  /**
   * ✅ Historial por rango (Reports / Visits page)
   */
  listByRange: (fromIso: string, toIso: string) =>
    httpRequest<ApiResponse<VisitDetailResponse[]>>(
      `/visits?from=${toIsoParam(fromIso)}&to=${toIsoParam(toIso)}`
    ),
};

/**
 * Helper ISO local (sin timezone issues)
 */
export function toIsoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}
