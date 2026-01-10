import { http } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/apiResponse";

export type ReportPeriod = "day" | "month" | "year";

/**
 * Filtro opcional por método de pago.
 * - Se manda solo si el usuario elige uno específico.
 * - "ALL" se resuelve en la UI (no llega al backend).
 */
export type PaymentMethod = "CASH" | "CARD" | "MOBILE_BANKING";

export type ReportSummaryResponse = {
  from: string; // LocalDateTime ISO
  to: string; // LocalDateTime ISO
  gross: string | number;
  adjustments: string | number;
  net: string | number;
};

export type ReportByCategoryRow = {
  category: string; // VisitItemCategory enum (string)
  total: string | number;
  percent: string | number; // 0..100
};

export type ReportByCategoryResponse = {
  from: string;
  to: string;
  rows: ReportByCategoryRow[];
};

export type ReportTimeseriesPoint = {
  bucket: string; // YYYY-MM-DD | YYYY-MM | YYYY
  gross: string | number;
  adjustments: string | number;
  net: string | number;
};

export type ReportTimeseriesResponse = {
  period: ReportPeriod;
  from: string;
  to: string;
  points: ReportTimeseriesPoint[];
};

function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const reportsApi = {
  summary(fromIso: string, toIso: string, paymentMethod?: PaymentMethod | null) {
    return http<ApiResponse<ReportSummaryResponse>>(
      `/reports/summary${qs({
        from: fromIso,
        to: toIso,
        paymentMethod: paymentMethod ?? null,
      })}`
    );
  },

  byCategory(fromIso: string, toIso: string, paymentMethod?: PaymentMethod | null) {
    return http<ApiResponse<ReportByCategoryResponse>>(
      `/reports/by-category${qs({
        from: fromIso,
        to: toIso,
        paymentMethod: paymentMethod ?? null,
      })}`
    );
  },

  timeseries(
    period: ReportPeriod,
    fromIso: string,
    toIso: string,
    paymentMethod?: PaymentMethod | null
  ) {
    return http<ApiResponse<ReportTimeseriesResponse>>(
      `/reports/timeseries${qs({
        period,
        from: fromIso,
        to: toIso,
        paymentMethod: paymentMethod ?? null,
      })}`
    );
  },
};
