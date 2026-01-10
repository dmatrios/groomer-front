"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import {
  reportsApi,
  type ReportPeriod,
  type PaymentMethod,
} from "@/features/reports/api/reportsApi";

function toNumber(v: string | number | null | undefined) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type ReportsData = {
  summary: {
    from: string;
    to: string;
    gross: number;
    adjustments: number;
    net: number;
  } | null;

  byCategory: {
    from: string;
    to: string;
    rows: { category: string; total: number; percent: number }[];
  } | null;

  timeseries: {
    period: ReportPeriod;
    from: string;
    to: string;
    points: { bucket: string; gross: number; adjustments: number; net: number }[];
  } | null;
};

type LastRunRef = {
  period: ReportPeriod;
  fromIso: string;
  toIso: string;
  paymentMethod?: PaymentMethod | null;
};

export function useReports() {
  const [data, setData] = useState<ReportsData>({
    summary: null,
    byCategory: null,
    timeseries: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastRef = useRef<LastRunRef | null>(null);

  /**
   * Carga: summary + byCategory + timeseries en paralelo.
   * paymentMethod es opcional (si no viene, no se envía).
   */
  const run = useCallback(
    async (
      period: ReportPeriod,
      fromIso: string,
      toIso: string,
      paymentMethod?: PaymentMethod | null
    ) => {
      setLoading(true);
      setError(null);
      lastRef.current = { period, fromIso, toIso, paymentMethod };

      try {
        const [s, c, t] = await Promise.all([
          reportsApi.summary(fromIso, toIso, paymentMethod ?? null),
          reportsApi.byCategory(fromIso, toIso, paymentMethod ?? null),
          reportsApi.timeseries(period, fromIso, toIso, paymentMethod ?? null),
        ]);

        const summaryRaw = s.data;
        const catRaw = c.data;
        const tsRaw = t.data;

        setData({
          summary: summaryRaw
            ? {
                from: summaryRaw.from,
                to: summaryRaw.to,
                gross: toNumber(summaryRaw.gross),
                adjustments: toNumber(summaryRaw.adjustments),
                net: toNumber(summaryRaw.net),
              }
            : null,

          byCategory: catRaw
            ? {
                from: catRaw.from,
                to: catRaw.to,
                rows: (catRaw.rows ?? []).map((r) => ({
                  category: String(r.category),
                  total: toNumber(r.total),
                  percent: toNumber(r.percent),
                })),
              }
            : null,

          timeseries: tsRaw
            ? {
                period: tsRaw.period,
                from: tsRaw.from,
                to: tsRaw.to,
                points: (tsRaw.points ?? []).map((p) => ({
                  bucket: p.bucket,
                  gross: toNumber(p.gross),
                  adjustments: toNumber(p.adjustments),
                  net: toNumber(p.net),
                })),
              }
            : null,
        });
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("Error cargando reportes");

        setData({ summary: null, byCategory: null, timeseries: null });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Refresh: vuelve a ejecutar el último run exactamente con los mismos parámetros.
   */
  const refresh = useCallback(() => {
    if (!lastRef.current) return;
    run(
      lastRef.current.period,
      lastRef.current.fromIso,
      lastRef.current.toIso,
      lastRef.current.paymentMethod ?? null
    );
  }, [run]);

  const hasData = useMemo(() => {
    return Boolean(data.summary || data.byCategory || data.timeseries);
  }, [data]);

  return { data, loading, error, run, refresh, hasData };
}
