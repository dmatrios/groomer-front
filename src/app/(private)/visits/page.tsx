"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
  PawPrint,
  RotateCcw,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";

import { useVisitsRange } from "@/features/visits/hooks/useVisitsRange";
import type { VisitDetailResponse } from "@/features/visits/api/visitsApi";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";

import {
  addDays,
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatDateLabel,
  formatMonthLabel,
  formatTimeHHmm,
  formatYearLabel,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "@/features/appointments/utils/dates";

/**
 * ✅ Chip mejorado:
 * - acepta title, className y cualquier prop de <span>
 * - mantiene el mismo estilo base
 */
function Chip({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      {...props}
      className={[
        "inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

type RangeView = "day" | "week" | "month" | "year";

function petLabel(v: VisitDetailResponse) {
  const name = (v.petName ?? "").trim();
  return name.length > 0 ? name : `Mascota #${v.petId}`;
}

export default function VisitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /** -----------------------------
   *  Deep-link desde Reportes
   *  ----------------------------- */
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");

  const hasExternalRange = Boolean(fromQ && toQ);

  const initialAnchor = useMemo(() => {
    if (fromQ) {
      const d = new Date(fromQ);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [fromQ]);

  const [view, setView] = useState<RangeView>("day");
  const [anchor, setAnchor] = useState<Date>(initialAnchor);

  /** -----------------------------
   *  Filtro petId (opcional)
   *  ----------------------------- */
  const [petIdRaw, setPetIdRaw] = useState("");
  const petId = useMemo(() => {
    const n = Number(petIdRaw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [petIdRaw]);

  /** -----------------------------
   *  Rango efectivo
   *  ----------------------------- */
  const { from, to, label } = useMemo(() => {
    // 👉 si vienes desde Reportes, respetamos el rango exacto
    if (hasExternalRange && fromQ && toQ) {
      const f = new Date(fromQ);
      return {
        from: new Date(fromQ),
        to: new Date(toQ),
        label: `Rango desde Reportes · ${formatDateLabel(f)}`,
      };
    }

    // 👉 comportamiento normal
    if (view === "day") {
      return {
        from: startOfDay(anchor),
        to: endOfDay(anchor),
        label: `Día · ${formatDateLabel(anchor)}`,
      };
    }
    if (view === "week") {
      const f = startOfWeek(anchor);
      const t = endOfWeek(anchor);
      return {
        from: f,
        to: t,
        label: `Semana · ${formatDateLabel(f)} → ${formatDateLabel(addDays(f, 6))}`,
      };
    }
    if (view === "month") {
      const f = startOfMonth(anchor);
      const t = endOfMonth(anchor);
      return { from: f, to: t, label: `Mes · ${formatMonthLabel(anchor)}` };
    }
    const f = startOfYear(anchor);
    const t = endOfYear(anchor);
    return { from: f, to: t, label: `Año · ${formatYearLabel(anchor)}` };
  }, [view, anchor, fromQ, toQ, hasExternalRange]);

  /** -----------------------------
   *  Carga visits
   *  ----------------------------- */
  const visits = useVisitsRange({ from, to, petId });
  const items = visits.items;

  /** -----------------------------
   *  Navegación rango
   *  ----------------------------- */
  function move(delta: number) {
    if (hasExternalRange) return; // bloqueado si viene desde Reportes
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else if (view === "month") setAnchor((d) => addMonths(d, delta));
    else setAnchor((d) => addYears(d, delta));
  }

  function clearExternalRange() {
    router.push("/visits");
  }

  /** -----------------------------
   *  Agrupar por día
   *  ----------------------------- */
  const grouped = useMemo(() => {
    const map = new Map<string, VisitDetailResponse[]>();
    for (const v of items) {
      const day = v.visitedAt.slice(0, 10);
      const arr = map.get(day) ?? [];
      arr.push(v);
      map.set(day, arr);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({
      key: k,
      title: k,
      items: (map.get(k) ?? []).slice().sort((a, b) => a.visitedAt.localeCompare(b.visitedAt)),
    }));
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Atenciones</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Historial de atenciones por rango. Puedes llegar aquí desde Reportes o navegar por fechas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondaryOutline" icon={RefreshCw} type="button" onClick={visits.refresh}>
            Actualizar
          </Button>

          <Link href="/visits/new">
            <Button variant="primary" icon={Plus} type="button">
              Nueva atención
            </Button>
          </Link>
        </div>
      </Card>

      {/* Controles */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <CalendarDays className="h-4 w-4 mr-1" />
              {label}
            </Chip>

            {hasExternalRange && (
              <Button variant="secondaryOutline" icon={RotateCcw} type="button" onClick={clearExternalRange}>
                Volver a hoy
              </Button>
            )}

            {!hasExternalRange && (
              <>
                <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
                  {(["day", "week", "month", "year"] as RangeView[]).map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? "primaryOutline" : "ghost"}
                      type="button"
                      className="px-3"
                      onClick={() => {
                        setView(v);
                        setAnchor(new Date());
                      }}
                    >
                      {v === "day" ? "Día" : v === "week" ? "Semana" : v === "month" ? "Mes" : "Año"}
                    </Button>
                  ))}
                </div>

                <Button variant="secondaryOutline" icon={ChevronLeft} type="button" onClick={() => move(-1)}>
                  Anterior
                </Button>

                <Button variant="secondaryOutline" icon={ChevronRight} type="button" onClick={() => move(1)}>
                  Siguiente
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip>{items.length === 0 ? "0 atenciones" : `${items.length} atención(es)`}</Chip>

            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <Filter className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                value={petIdRaw}
                onChange={(e) => setPetIdRaw(e.target.value)}
                placeholder="petId (opcional)"
                className="w-40 bg-transparent text-sm outline-none"
                inputMode="numeric"
              />
            </div>

            {petId && (
              <Chip>
                <PawPrint className="h-4 w-4 mr-1" />
                Mascota #{petId}
              </Chip>
            )}
          </div>
        </div>
      </Card>

      {/* Contenido */}
      {visits.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando atenciones…</div>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">No hay atenciones en este rango.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <Card key={g.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{g.title}</div>
                <Chip>{g.items.length} atención(es)</Chip>
              </div>

              {g.items.map((v) => {
                const pay = v.payment?.status ? paymentStatusUI[v.payment.status] : null;

                return (
                  <div
                    key={v.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                               px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">{formatTimeHHmm(v.visitedAt)}</div>

                        <Chip># {v.id}</Chip>

                        {/* ✅ nombre de mascota (fallback a #id) */}
                        <Chip title={(v.petName ?? "").trim() ? v.petName! : undefined}>
                          <PawPrint className="h-4 w-4 mr-1" />
                          {petLabel(v)}
                        </Chip>

                        {v.appointmentId != null && <Chip>Cita #{v.appointmentId}</Chip>}
                        {pay && <Badge variant={pay.variant}>{pay.label}</Badge>}
                      </div>

                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        Total: {v.totalAmount} {v.notes ? ` · ${v.notes}` : ""}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/visits/${v.id}`}>
                        <Button variant="secondaryOutline" icon={Eye} type="button">
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/visits/${v.id}/edit`}>
                        <Button variant="primaryOutline" icon={Pencil} type="button">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
