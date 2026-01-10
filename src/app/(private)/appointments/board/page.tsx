// src/app/(private)/appointments/board/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
  CalendarClock,
  Ban,
  CheckCircle2,
  LayoutGrid,
  List,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";

import { useAppointmentsRange } from "@/features/appointments/hooks/useAppointmentsRange";
import { appointmentStatusUI } from "@/features/appointments/ui/appointmentStatusUI";
import type {
  AppointmentResponse,
  AppointmentStatus,
} from "@/features/appointments/api/appointmentsApi";

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
type BoardMode = "cards" | "list";

export default function AppointmentsBoardPage() {
  const [view, setView] = useState<RangeView>("day");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [mode, setMode] = useState<BoardMode>("cards");

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
      return {
        from: f,
        to: endOfWeek(anchor),
        label: `Semana · ${formatDateLabel(f)} → ${formatDateLabel(addDays(f, 6))}`,
      };
    }
    if (view === "month") {
      return {
        from: startOfMonth(anchor),
        to: endOfMonth(anchor),
        label: `Mes · ${formatMonthLabel(anchor)}`,
      };
    }
    return {
      from: startOfYear(anchor),
      to: endOfYear(anchor),
      label: `Año · ${formatYearLabel(anchor)}`,
    };
  }, [view, anchor]);

  const appts = useAppointmentsRange({ from, to, status });
  const items = appts.items;

  function move(delta: number) {
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else if (view === "month") setAnchor((d) => addMonths(d, delta));
    else setAnchor((d) => addYears(d, delta));
  }

  // para board: orden simple por startAt (la API ya trae rango)
  const sorted = useMemo(
    () => items.slice().sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [items]
  );

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
          <h2 className="text-xl font-semibold">Citas · Vista densa</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Tablero rápido para operar. Cambia entre cards o lista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/appointments">
            <Button variant="secondaryOutline" type="button">
              Vista normal
            </Button>
          </Link>

          <Button
            variant="secondaryOutline"
            type="button"
            onClick={appts.refresh}
          >
            Actualizar
          </Button>

          <Link href="/appointments/new">
            <Button variant="primary" type="button">
              Nueva cita
            </Button>
          </Link>
        </div>
      </Card>

      {/* Controles */}
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
                onClick={() => setView("day")}
              >
                Día
              </Button>
              <Button
                variant={view === "week" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => setView("week")}
              >
                Semana
              </Button>
              <Button
                variant={view === "month" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => setView("month")}
              >
                Mes
              </Button>
              <Button
                variant={view === "year" ? "primaryOutline" : "ghost"}
                type="button"
                className="px-3"
                onClick={() => setView("year")}
              >
                Año
              </Button>
            </div>

            <Button
              variant="secondaryOutline"
              icon={ChevronLeft}
              type="button"
              onClick={() => move(-1)}
            >
              {view === "day"
                ? "Día ant."
                : view === "week"
                ? "Semana ant."
                : view === "month"
                ? "Mes ant."
                : "Año ant."}
            </Button>

            <Button
              variant="secondaryOutline"
              icon={ChevronRight}
              type="button"
              onClick={() => move(1)}
            >
              {view === "day"
                ? "Día sig."
                : view === "week"
                ? "Semana sig."
                : view === "month"
                ? "Mes sig."
                : "Año sig."}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              {sorted.length === 0 ? "0 citas" : `${sorted.length} cita(s)`}
            </Chip>

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

            {/* Toggle mode */}
            <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
              <Button
                variant={mode === "cards" ? "primaryOutline" : "ghost"}
                icon={LayoutGrid}
                type="button"
                className="px-3"
                onClick={() => setMode("cards")}
              >
                Cards
              </Button>
              <Button
                variant={mode === "list" ? "primaryOutline" : "ghost"}
                icon={List}
                type="button"
                className="px-3"
                onClick={() => setMode("list")}
              >
                Lista
              </Button>
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
      ) : sorted.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">
            No hay citas en este rango (o con el filtro seleccionado).
          </div>
        </Card>
      ) : mode === "cards" ? (
        // ✅ Cards (grid denso)
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((a: AppointmentResponse) => {
            const ui = appointmentStatusUI[a.status];

            return (
              <Card key={a.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {formatTimeHHmm(a.startAt)} – {formatTimeHHmm(a.endAt)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={ui.variant}>{ui.label}</Badge>
                      <Chip># {a.id}</Chip>
                      <Chip>Mascota #{a.petId}</Chip>
                    </div>
                  </div>
                </div>

                <div className="truncate text-xs text-[color:var(--muted)]">
                  {a.notes ? a.notes : "—"}
                </div>

                <div className="flex flex-wrap gap-2">
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
                        <Button
                          variant="secondaryOutline"
                          icon={CalendarClock}
                          type="button"
                        >
                          Reprog.
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
              </Card>
            );
          })}
        </div>
      ) : (
        // ✅ Lista (súper densa)
        <div className="space-y-2">
          {sorted.map((a: AppointmentResponse) => {
            const ui = appointmentStatusUI[a.status];

            return (
              <Card
                key={a.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">
                      {formatTimeHHmm(a.startAt)} – {formatTimeHHmm(a.endAt)}
                    </div>
                    <Badge variant={ui.variant}>{ui.label}</Badge>
                    <Chip># {a.id}</Chip>
                    <Chip>Mascota #{a.petId}</Chip>
                  </div>

                  <div className="mt-1 truncate text-xs text-[color:var(--muted)]">
                    {a.notes ? a.notes : "—"}
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
                        <Button
                          variant="secondaryOutline"
                          icon={CalendarClock}
                          type="button"
                        >
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
