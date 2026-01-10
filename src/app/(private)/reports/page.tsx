"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  Calendar,
  ChevronDown,
  Info,
  HelpCircle,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";
import { Modal } from "@/shared/ui/components/Modal";

import { useReports } from "@/features/reports/hooks/useReports";
import type { ReportPeriod, PaymentMethod } from "@/features/reports/api/reportsApi";

import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatDateLabel,
  formatMonthLabel,
  formatYearLabel,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toIsoLocal,
} from "@/features/appointments/utils/dates";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `S/ ${n.toFixed(2)}`;
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

type RangeView = "day" | "week" | "month" | "year" | "custom";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthOptionsEs() {
  return [
    { value: 0, label: "Enero" },
    { value: 1, label: "Febrero" },
    { value: 2, label: "Marzo" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Mayo" },
    { value: 5, label: "Junio" },
    { value: 6, label: "Julio" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setiembre" },
    { value: 9, label: "Octubre" },
    { value: 10, label: "Noviembre" },
    { value: 11, label: "Diciembre" },
  ];
}

function buildYearRange(centerYear: number, span = 6) {
  const start = centerYear - span;
  const end = centerYear + span;
  const years: number[] = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

/** calendario del mes: matriz de semanas */
function monthMatrix(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);

  // Lunes=0 ... Domingo=6 (ajuste)
  const dowFirst = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();

  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  // prev month padding
  for (let i = 0; i < dowFirst; i++) {
    const d = new Date(year, month0, 1);
    d.setDate(d.getDate() - (dowFirst - i));
    cells.push({ date: d, inMonth: false });
  }

  // month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month0, day), inMonth: true });
  }

  // next month padding to complete weeks
  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1]?.date ?? new Date(year, month0, daysInMonth);
    const next = new Date(lastCell);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function detailLabel(period: ReportPeriod) {
  if (period === "day") return "Por día";
  if (period === "month") return "Por mes";
  return "Por año";
}

export default function ReportsPage() {
  const r = useReports();
  const router = useRouter();

  const [rangeView, setRangeView] = useState<RangeView>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  // Detalle (antes "Serie"): cómo se agrupan los resultados
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [periodTouched, setPeriodTouched] = useState(false);

  // Filtro por método de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "ALL">("ALL");

  // custom range inputs (datetime-local)
  const [fromInput, setFromInput] = useState(() => toIsoLocal(startOfDay(new Date())).slice(0, 16));
  const [toInput, setToInput] = useState(() => toIsoLocal(endOfDay(new Date())).slice(0, 16));

  // Premium UX: no auto-run al entrar. Mostramos hint hasta que genere.
  const [hasGenerated, setHasGenerated] = useState(false);

  // Si cambias filtros, marcamos "pendiente de generar"
  const [isStale, setIsStale] = useState(false);

  // Calendario anual (solo UI)
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // range -> fromIso/toIso
  const range = useMemo(() => {
    if (rangeView === "custom") {
      const fromIso = fromInput.length === 16 ? `${fromInput}:00` : fromInput;
      const toIso = toInput.length === 16 ? `${toInput}:00` : toInput;
      return { label: `Personalizado · ${fromInput} → ${toInput}`, fromIso, toIso };
    }

    if (rangeView === "day") {
      const f = startOfDay(anchor);
      const t = endOfDay(anchor);
      return { label: `Día · ${formatDateLabel(anchor)}`, fromIso: toIsoLocal(f), toIso: toIsoLocal(t) };
    }

    if (rangeView === "week") {
      const f = startOfWeek(anchor);
      const t = endOfWeek(anchor);
      return {
        label: `Semana · ${formatDateLabel(f)} → ${formatDateLabel(new Date(f.getTime() + 6 * 86400000))}`,
        fromIso: toIsoLocal(f),
        toIso: toIsoLocal(t),
      };
    }

    if (rangeView === "month") {
      const f = startOfMonth(anchor);
      const t = endOfMonth(anchor);
      return { label: `Mes · ${formatMonthLabel(anchor)}`, fromIso: toIsoLocal(f), toIso: toIsoLocal(t) };
    }

    const f = startOfYear(anchor);
    const t = endOfYear(anchor);
    return { label: `Año · ${formatYearLabel(anchor)}`, fromIso: toIsoLocal(f), toIso: toIsoLocal(t) };
  }, [rangeView, anchor, fromInput, toInput]);

  const label = range.label;
  const fromIso = range.fromIso;
  const toIso = range.toIso;

  // Auto-ajuste del "Detalle" (no invasivo si el usuario ya eligió)
  useEffect(() => {
    if (periodTouched) return;

    if (rangeView === "year") setPeriod("month");
    else if (rangeView === "month") setPeriod("day");
    else setPeriod("day");
  }, [rangeView, periodTouched]);

  // Selector directo mes/año
  const anchorYear = anchor.getFullYear();
  const anchorMonth0 = anchor.getMonth();

  const yearOptions = useMemo(() => buildYearRange(new Date().getFullYear(), 8), []);
  const monthOpts = useMemo(() => monthOptionsEs(), []);

  function setMonthAndYear(month0: number, year: number) {
    const d = new Date(anchor);
    d.setFullYear(year);
    d.setMonth(month0);
    d.setDate(1);
    setAnchor(d);
  }

  function setYear(year: number) {
    const d = new Date(anchor);
    d.setFullYear(year);
    d.setMonth(0);
    d.setDate(1);
    setAnchor(d);
  }

  // ---- STALE TRACKING (clave UX) ----
  const appliedRef = useRef<{
    rangeView: RangeView;
    anchorYmd: string;
    fromInput: string;
    toInput: string;
    period: ReportPeriod;
    paymentMethod: PaymentMethod | "ALL";
  } | null>(null);

  // Cuando cambian filtros, si ya se generó alguna vez, marcamos como "pendiente"
  useEffect(() => {
    if (!hasGenerated) return;
    if (!appliedRef.current) return;

    const current = {
      rangeView,
      anchorYmd: ymd(anchor),
      fromInput,
      toInput,
      period,
      paymentMethod,
    };

    const prev = appliedRef.current;
    const changed =
      prev.rangeView !== current.rangeView ||
      prev.anchorYmd !== current.anchorYmd ||
      prev.fromInput !== current.fromInput ||
      prev.toInput !== current.toInput ||
      prev.period !== current.period ||
      prev.paymentMethod !== current.paymentMethod;

    setIsStale(changed);
  }, [hasGenerated, rangeView, anchor, fromInput, toInput, period, paymentMethod]);

  function runNow() {
    setHasGenerated(true);
    setCalendarOpen(false);
    setSelectedDay(null);

    const pm = paymentMethod === "ALL" ? null : paymentMethod;
    r.run(period, fromIso, toIso, pm);

    appliedRef.current = {
      rangeView,
      anchorYmd: ymd(anchor),
      fromInput,
      toInput,
      period,
      paymentMethod,
    };
    setIsStale(false);
  }

  function refresh() {
    if (!hasGenerated) return;
    // refresh re-ejecuta el último "run" real (sin tomar cambios pendientes)
    r.refresh();
  }

  // Para calendario anual: necesitamos “day buckets” aunque el panel esté en month/year.
  useEffect(() => {
    if (!calendarOpen) return;
    if (rangeView !== "year") return;

    const pm = paymentMethod === "ALL" ? null : paymentMethod;
    setHasGenerated(true);
    r.run("day", fromIso, toIso, pm);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarOpen]);

  const summary = r.data.summary;
  const byCat = r.data.byCategory;
  const ts = r.data.timeseries;

  const maxNet = useMemo(() => {
    const arr = ts?.points?.map((p) => asNumber(p.net)) ?? [];
    const m = arr.length ? Math.max(...arr) : 0;
    return Number.isFinite(m) ? m : 0;
  }, [ts?.points]);

  const dayNetMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!ts?.points) return map;
    for (const p of ts.points) map.set(p.bucket, asNumber(p.net));
    return map;
  }, [ts?.points]);

  const selectedDaySummary = useMemo(() => {
    if (!selectedDay) return null;
    const net = dayNetMap.get(selectedDay) ?? 0;

    const point = ts?.points?.find((p) => p.bucket === selectedDay);
    if (!point) return { bucket: selectedDay, gross: 0, adjustments: 0, net };

    return {
      bucket: selectedDay,
      gross: asNumber(point.gross),
      adjustments: asNumber(point.adjustments),
      net: asNumber(point.net),
    };
  }, [selectedDay, dayNetMap, ts?.points]);

  const paymentLabel =
    paymentMethod === "ALL"
      ? "Todos"
      : paymentMethod === "CASH"
      ? "Efectivo"
      : paymentMethod === "CARD"
      ? "Tarjeta"
      : "Banca móvil";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Reportes</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Elige filtros y presiona <b>Generar</b>. Si cambias algo, te avisaremos para volver a generar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondaryOutline"
            icon={RefreshCw}
            type="button"
            onClick={refresh}
            disabled={r.loading || !hasGenerated}
            title={!hasGenerated ? "Genera primero para habilitar actualizar" : "Actualizar (misma consulta)"}
          >
            Actualizar
          </Button>

          <Button variant="primary" icon={BarChart3} type="button" onClick={runNow} disabled={r.loading}>
            {hasGenerated && isStale ? "Generar (actualizar)" : "Generar"}
          </Button>
        </div>
      </Card>

      {/* Controls */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {label}
              </span>
            </Chip>

            <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
              <Button
                variant={rangeView === "day" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setRangeView("day");
                  setAnchor(new Date());
                }}
              >
                Día
              </Button>
              <Button
                variant={rangeView === "week" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setRangeView("week");
                  setAnchor(new Date());
                }}
              >
                Semana
              </Button>
              <Button
                variant={rangeView === "month" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setRangeView("month");
                  setAnchor(new Date());
                }}
              >
                Mes
              </Button>
              <Button
                variant={rangeView === "year" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setRangeView("year");
                  setAnchor(new Date());
                }}
              >
                Año
              </Button>
              <Button variant={rangeView === "custom" ? "primaryOutline" : "ghost"} type="button" className="px-3" onClick={() => setRangeView("custom")}>
                Custom
              </Button>
            </div>

            {(rangeView === "month" || rangeView === "year") && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                {rangeView === "month" && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-semibold text-[color:var(--muted)]">Mes</span>
                    <select
                      value={anchorMonth0}
                      onChange={(e) => setMonthAndYear(Number(e.target.value), anchorYear)}
                      className="bg-transparent text-sm outline-none"
                      disabled={r.loading}
                    >
                      {monthOpts.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold text-[color:var(--muted)]">Año</span>
                  <select
                    value={anchorYear}
                    onChange={(e) => (rangeView === "month" ? setMonthAndYear(anchorMonth0, Number(e.target.value)) : setYear(Number(e.target.value)))}
                    className="bg-transparent text-sm outline-none"
                    disabled={r.loading}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>

                <ChevronDown className="h-4 w-4 text-[color:var(--muted)]" />
              </div>
            )}

            {rangeView === "year" && (
              <Button
                variant={calendarOpen ? "primaryOutline" : "secondaryOutline"}
                icon={Calendar}
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                disabled={r.loading}
              >
                Vista calendario
              </Button>
            )}
          </div>

          {/* Right: Detalle + Método */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Detalle</span>
              <select
                value={period}
                onChange={(e) => {
                  setPeriodTouched(true);
                  setPeriod(e.target.value as ReportPeriod);
                }}
                className="bg-transparent text-sm outline-none"
                disabled={r.loading}
              >
                <option value="day">Por día</option>
                <option value="month">Por mes</option>
                <option value="year">Por año</option>
              </select>

              <span
                className="inline-flex items-center"
                title="Define el nivel de detalle (cómo se agrupan los resultados)."
              >
                <HelpCircle className="h-4 w-4 text-[color:var(--muted)]" />
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <span className="text-xs font-semibold text-[color:var(--muted)]">Método</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="bg-transparent text-sm outline-none"
                disabled={r.loading}
              >
                <option value="ALL">Todos</option>
                <option value="CASH">Efectivo</option>
                <option value="MOBILE_BANKING">Banca móvil</option>
                <option value="CARD">Tarjeta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Banner: cambios pendientes (lenguaje humano) */}
        {hasGenerated && isStale && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-white/40 p-2">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold">Cambios pendientes</div>
                <div className="mt-1 text-[color:var(--muted)]">
                  Cambiaste filtros (<b>{label}</b>, detalle <b>{detailLabel(period)}</b>, método{" "}
                  <b>{paymentLabel}</b>). Presiona <b>Generar</b> para actualizar.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom range */}
        {rangeView === "custom" && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-end">
            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">Desde</div>
              <input
                type="datetime-local"
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-[color:var(--muted)]">Hasta</div>
              <input
                type="datetime-local"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="flex gap-2 lg:justify-end">
              <Button variant="secondaryOutline" type="button" onClick={() => setRangeView("month")}>
                Cancelar
              </Button>
              <Button variant="primary" type="button" onClick={runNow} disabled={r.loading}>
                Aplicar y generar
              </Button>
            </div>
          </div>
        )}

        {!hasGenerated && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-white/40 p-2">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold">Aún no has generado el reporte</div>
                <div className="mt-1 text-[color:var(--muted)]">
                  Ajusta rango, detalle y método, luego presiona <b>Generar</b>.
                </div>
              </div>
            </div>
          </div>
        )}

        {r.error && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{r.error}</span>
          </div>
        )}
      </Card>

      {/* Calendario anual */}
      {rangeView === "year" && calendarOpen && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Calendario {anchorYear}</div>
              <div className="text-xs text-[color:var(--muted)]">
                Click en un día para ver resumen. Indicador = hubo net en ese día.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip>Tip: si cambias filtros, presiona Generar</Chip>
              <Button variant="secondaryOutline" type="button" onClick={() => setCalendarOpen(false)}>
                Cerrar calendario
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {monthOpts.map((m) => {
              const weeks = monthMatrix(anchorYear, m.value);

              return (
                <div
                  key={m.value}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
                >
                  <div className="mb-2 text-sm font-semibold">{m.label}</div>

                  <div className="grid grid-cols-7 gap-1 text-xs text-[color:var(--muted)]">
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                      <div key={idx} className="px-1 py-1 text-center font-semibold">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="mt-1 space-y-1">
                    {weeks.map((w, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-1">
                        {w.map((cell, ci) => {
                          const key = ymd(cell.date);
                          const net = dayNetMap.get(key) ?? 0;
                          const hasNet = net > 0;

                          return (
                            <button
                              key={ci}
                              type="button"
                              onClick={() => setSelectedDay(key)}
                              className={[
                                "relative rounded-lg border px-2 py-2 text-left transition-all duration-200 hover:shadow-sm",
                                cell.inMonth ? "border-[color:var(--border)]" : "border-transparent opacity-50",
                                selectedDay === key ? "ring-2 ring-[color:var(--brand-cyan)]" : "",
                              ].join(" ")}
                              title={hasNet ? `Net: ${money(net)}` : "Sin net"}
                            >
                              <div className="text-xs font-semibold">{cell.date.getDate()}</div>

                              {hasNet && (
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[color:var(--brand-cyan)]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Content */}
      {r.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando reportes…</div>
      ) : !hasGenerated ? null : !r.hasData ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">No hay data para el rango seleccionado.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Resumen</div>
                  <div className="text-xs text-[color:var(--muted)]">Gross, adjustments y net</div>
                </div>
              </div>

              <Badge variant="attended">OK</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Gross</div>
                <div className="mt-1 text-lg font-semibold">{summary ? money(asNumber(summary.gross)) : "—"}</div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Adjustments</div>
                <div className="mt-1 text-lg font-semibold">
                  {summary ? money(asNumber(summary.adjustments)) : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Net</div>
                <div className="mt-1 text-lg font-semibold">{summary ? money(asNumber(summary.net)) : "—"}</div>
              </div>
            </div>
          </Card>

          {/* By Category */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Por categoría</div>
                <div className="text-xs text-[color:var(--muted)]">Aporte por tipo de item</div>
              </div>
              <Chip>{byCat?.rows?.length ?? 0}</Chip>
            </div>

            {!byCat || byCat.rows.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">Sin data en este rango.</div>
            ) : (
              <div className="space-y-2">
                {byCat.rows
                  .slice()
                  .sort((a, b) => asNumber(b.total) - asNumber(a.total))
                  .map((row) => (
                    <div
                      key={row.category}
                      className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{row.category}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{pct(asNumber(row.percent))}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-[color:var(--muted)]">Total</div>
                        <div className="text-base font-semibold">{money(asNumber(row.total))}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Timeseries */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Detalle en el tiempo</div>
                <div className="text-xs text-[color:var(--muted)]">
                  Resultados agrupados: <b>{detailLabel(ts?.period ?? period)}</b>
                </div>
              </div>
              <Chip>{ts?.points?.length ?? 0}</Chip>
            </div>

            {!ts || ts.points.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">Sin puntos en este rango.</div>
            ) : (
              <div className="space-y-2">
                {ts.points.map((p) => {
                  const net = asNumber(p.net);
                  const width = maxNet > 0 ? Math.max(2, Math.round((net / maxNet) * 100)) : 0;

                  return (
                    <div
                      key={p.bucket}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Chip>{p.bucket}</Chip>
                        <div className="flex flex-wrap gap-2">
                          <Chip>Gross: {money(asNumber(p.gross))}</Chip>
                          <Chip>Adj: {money(asNumber(p.adjustments))}</Chip>
                          <Chip>
                            Net: <span className="ml-1 font-semibold">{money(net)}</span>
                          </Chip>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-[color:var(--border)] bg-white/40">
                        <div className="h-full rounded-full bg-[color:var(--brand-cyan)]" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal del día (desde calendario anual) */}
      <Modal
        open={Boolean(selectedDay)}
        title={selectedDay ? `Detalle del día · ${selectedDay}` : "Detalle del día"}
        description="Resumen basado en el detalle del reporte (net/gross/adjustments)."
        onClose={() => setSelectedDay(null)}
        primaryText={selectedDay ? "Ver atenciones del día" : undefined}
        onPrimary={
          selectedDay
            ? () => {
                const d = new Date(`${selectedDay}T00:00:00`);
                const from = toIsoLocal(startOfDay(d));
                const to = toIsoLocal(endOfDay(d));
                router.push(`/visits?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
              }
            : undefined
        }
      >
        {!selectedDaySummary ? (
          <div className="text-sm text-[color:var(--muted)]">Sin data.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Gross</div>
                <div className="mt-1 text-base font-semibold">{money(selectedDaySummary.gross)}</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Adjustments</div>
                <div className="mt-1 text-base font-semibold">{money(selectedDaySummary.adjustments)}</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-xs font-semibold text-[color:var(--muted)]">Net</div>
                <div className="mt-1 text-base font-semibold">{money(selectedDaySummary.net)}</div>
              </div>
            </div>

            <div className="text-xs text-[color:var(--muted)]">
              Tip: si cambias filtros en Reportes, presiona <b>Generar</b> para actualizar.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
