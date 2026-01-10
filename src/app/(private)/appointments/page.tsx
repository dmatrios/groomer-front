// src/app/(private)/appointments/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
  CalendarClock,
  Ban,
  CheckCircle2,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";

import { appointmentStatusUI } from "@/features/appointments/ui/appointmentStatusUI";
import type { AppointmentResponse, AppointmentStatus } from "@/features/appointments/api/appointmentsApi";

import { useAppointmentsRange } from "@/features/appointments/hooks/useAppointmentsRange";

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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

type RangeView = "day" | "week" | "month" | "year";

export default function AppointmentsPage() {
  const [view, setView] = useState<RangeView>("day");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const [status, setStatus] = useState<AppointmentStatus | undefined>(undefined);

  const { from, to, label } = useMemo(() => {
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
      return {
        from: f,
        to: t,
        label: `Mes · ${formatMonthLabel(anchor)}`,
      };
    }
    // year
    const f = startOfYear(anchor);
    const t = endOfYear(anchor);
    return {
      from: f,
      to: t,
      label: `Año · ${formatYearLabel(anchor)}`,
    };
  }, [view, anchor]);

  const appts = useAppointmentsRange({ from, to, status });

  function move(delta: number) {
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else if (view === "month") setAnchor((d) => addMonths(d, delta));
    else setAnchor((d) => addYears(d, delta));
  }

  const items = appts.items;

  // agrupación según vista (sin re-consultar)
  const grouped = useMemo(() => {
    if (view === "year") {
      // agrupar por mes YYYY-MM
      const map = new Map<string, AppointmentResponse[]>();
      for (const a of items) {
        const month = a.startAt.slice(0, 7); // YYYY-MM
        const arr = map.get(month) ?? [];
        arr.push(a);
        map.set(month, arr);
      }
      const keys = Array.from(map.keys()).sort();
      return keys.map((k) => ({
        key: k,
        title: k,
        items: (map.get(k) ?? []).slice().sort((x, y) => x.startAt.localeCompare(y.startAt)),
      }));
    }

    // day/week/month -> agrupar por día YYYY-MM-DD
    const map = new Map<string, AppointmentResponse[]>();
    for (const a of items) {
      const day = a.startAt.slice(0, 10);
      const arr = map.get(day) ?? [];
      arr.push(a);
      map.set(day, arr);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({
      key: k,
      title: k,
      items: (map.get(k) ?? []).slice().sort((x, y) => x.startAt.localeCompare(y.startAt)),
    }));
  }, [items, view]);

  const statusOptions: Array<{ label: string; value?: AppointmentStatus }> = [
    { label: "Todas", value: undefined },
    { label: "Pendientes", value: "PENDING" },
    { label: "Atendidas", value: "ATTENDED" },
    { label: "Canceladas", value: "CANCELED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Citas</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Agenda por rango. Acciones disponibles dependen del estado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/appointments/board">
            <Button variant="secondaryOutline" type="button">
              Vista densa
            </Button>
          </Link>
          <Button variant="secondaryOutline" icon={RefreshCw} type="button" onClick={appts.refresh}>
            Actualizar
          </Button>

          <Link href="/appointments/new">
            <Button variant="primary" icon={Plus} type="button">
              Nueva cita
            </Button>
          </Link>
        </div>
      </Card>

      {/* Controles rango + filtros */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {label}
              </span>
            </Chip>

            <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
              <Button
                variant={view === "day" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setView("day");
                  setAnchor(new Date());
                }}
              >
                Día
              </Button>
              <Button
                variant={view === "week" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setView("week");
                  setAnchor(new Date());
                }}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setView("month");
                  setAnchor(new Date());
                }}
              >
                Mes
              </Button>
              <Button
                variant={view === "year" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => {
                  setView("year");
                  setAnchor(new Date());
                }}
              >
                Año
              </Button>
            </div>

            <Button variant="secondaryOutline" icon={ChevronLeft} type="button" onClick={() => move(-1)}>
              {view === "day" ? "Día ant." : view === "week" ? "Semana ant." : view === "month" ? "Mes ant." : "Año ant."}
            </Button>

            <Button variant="secondaryOutline" icon={ChevronRight} type="button" onClick={() => move(1)}>
              {view === "day" ? "Día sig." : view === "week" ? "Semana sig." : view === "month" ? "Mes sig." : "Año sig."}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip>{items.length === 0 ? "0 citas" : `${items.length} cita(s)`}</Chip>

            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <Filter className="h-4 w-4 text-[color:var(--muted)]" />
              <select
                value={status ?? ""}
                onChange={(e) => {
                  const v = e.target.value as AppointmentStatus | "";
                  setStatus(v === "" ? undefined : v);
                }}
                className="bg-transparent text-sm outline-none"
              >
                {statusOptions.map((o) => (
                  <option key={o.label} value={o.value ?? ""}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {appts.error && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{appts.error}</span>
          </div>
        )}
      </Card>

      {/* Contenido */}
      {appts.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando citas...</div>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">
            No hay citas en este rango (o con el filtro seleccionado).
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <Card key={g.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">{g.title}</div>
                <Chip>{g.items.length} cita(s)</Chip>
              </div>

              <div className="space-y-2">
                {g.items.map((a) => {
                  const ui = appointmentStatusUI[a.status];

                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold">
                            {formatTimeHHmm(a.startAt)} – {formatTimeHHmm(a.endAt)}
                          </div>
                          <Badge variant={ui.variant}>{ui.label}</Badge>
                          <Chip># {a.id}</Chip>
                        </div>

                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          Mascota #{a.petId}
                          {a.notes ? ` · ${a.notes}` : ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Link href={`/appointments/${a.id}`}>
                          <Button variant="secondaryOutline" icon={Eye} type="button">
                            Ver
                          </Button>
                        </Link>

                        {a.status === "PENDING" && (
                          <>
                            <Link href={`/appointments/${a.id}/edit`}>
                              <Button variant="primaryOutline" icon={Pencil} type="button">
                                Editar
                              </Button>
                            </Link>
                            <Link href={`/appointments/${a.id}/reschedule`}>
                              <Button variant="secondaryOutline" icon={CalendarClock} type="button">
                                Reprogramar
                              </Button>
                            </Link>
                            <Link href={`/appointments/${a.id}/cancel`}>
                              <Button variant="secondaryOutline" icon={Ban} type="button">
                                Cancelar
                              </Button>
                            </Link>
                            <Link href={`/appointments/${a.id}?action=attend`}>
                              <Button variant="primary" icon={CheckCircle2} type="button">
                                Atender
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
