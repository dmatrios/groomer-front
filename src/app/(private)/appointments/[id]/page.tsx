// src/app/(private)/appointments/[id]/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Pencil,
  CalendarClock,
  Ban,
  CheckCircle2,
  PawPrint,
  StickyNote,
  AlertTriangle,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";

import { ApiError } from "@/shared/http/apiError"; // si te falla por mayúsculas: "@/shared/http/ApiError"

import { appointmentStatusUI } from "@/features/appointments/ui/appointmentStatusUI";
import { appointmentsApi } from "@/features/appointments/api/appointmentsApi";
import { useAppointmentDetail } from "@/features/appointments/hooks/useAppointmentDetail";

import { formatDateLabel, formatTimeHHmm } from "@/features/appointments/utils/dates";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const id = Number(params.id);
  const { item, loading, error, refresh } = useAppointmentDetail(id);

  const [attendConfirm, setAttendConfirm] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Si viene ?action=attend, abrimos confirmación
  useEffect(() => {
    const a = search.get("action");
    if (a === "attend") setAttendConfirm(true);
  }, [search]);

  const ui = useMemo(() => {
    if (!item) return null;
    return appointmentStatusUI[item.status];
  }, [item]);

  const dateLabel = useMemo(() => {
    if (!item) return "";
    // startAt es ISO string en frontend (asumimos), tomamos solo fecha de startAt
    const day = item.startAt.slice(0, 10);
    // para label bonito usamos Date
    const d = new Date(`${day}T00:00:00`);
    return formatDateLabel(d);
  }, [item]);

  async function onAttend() {
    if (!item) return;

    setActing(true);
    setActionError(null);

    try {
      await appointmentsApi.attend(item.id);
      setAttendConfirm(false);

      // limpiamos el query param action=attend sin recargar
      router.replace(`/appointments/${item.id}`);

      await refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo marcar como atendida";

      setActionError(msg);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Detalle de cita</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Información de la cita + acciones según estado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondaryOutline"
            icon={RefreshCw}
            type="button"
            onClick={refresh}
          >
            Actualizar
          </Button>

          <Link href="/appointments">
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>
        </div>
      </Card>

      {error && (
        <Card className="p-6 text-sm">
          <div className="font-semibold">Error</div>
          <div className="mt-1 text-[color:var(--muted)]">{error}</div>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !item ? null : (
        <>
          {/* Info principal */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Chip># {item.id}</Chip>
                {ui && <Badge variant={ui.variant}>{ui.label}</Badge>}
                <Chip>{dateLabel}</Chip>
              </div>

              <div className="text-sm font-semibold">
                {formatTimeHHmm(item.startAt)} – {formatTimeHHmm(item.endAt)}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                  <PawPrint className="h-4 w-4" />
                  Mascota
                </div>
                <div className="mt-1 text-sm font-semibold">
                  Mascota #{item.petId}
                </div>
                <div className="mt-2">
                  <Link href={`/pets/${item.petId}`}>
                    <Button variant="secondaryOutline" icon={Eye} type="button">
                      Ver mascota
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                  <StickyNote className="h-4 w-4" />
                  Notas
                </div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  {item.notes ? item.notes : "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Confirmación attend */}
          {attendConfirm && item.status === "PENDING" && (
            <Card className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Confirmar atención</div>
                  <div className="text-sm text-[color:var(--muted)]">
                    Esta acción marcará la cita como <b>ATENDIDA</b>. ¿Continuar?
                  </div>
                </div>
              </div>

              {actionError && (
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
                  <span className="font-semibold">Error:</span>{" "}
                  <span className="text-[color:var(--muted)]">{actionError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondaryOutline"
                  type="button"
                  onClick={() => setAttendConfirm(false)}
                  disabled={acting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  type="button"
                  onClick={onAttend}
                  disabled={acting}
                >
                  Confirmar
                </Button>
              </div>
            </Card>
          )}

          {/* Acciones */}
          <Card className="space-y-3">
            <div className="text-sm font-semibold">Acciones</div>

            {item.status !== "PENDING" ? (
              <div className="text-sm text-[color:var(--muted)]">
                Esta cita ya no está pendiente. No se puede editar/reprogramar/cancelar.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link href={`/appointments/${item.id}/edit`}>
                  <Button variant="primaryOutline" icon={Pencil} type="button">
                    Editar
                  </Button>
                </Link>

                <Link href={`/appointments/${item.id}/reschedule`}>
                  <Button
                    variant="secondaryOutline"
                    icon={CalendarClock}
                    type="button"
                  >
                    Reprogramar
                  </Button>
                </Link>

                <Link href={`/appointments/${item.id}/cancel`}>
                  <Button variant="secondaryOutline" icon={Ban} type="button">
                    Cancelar
                  </Button>
                </Link>

                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  type="button"
                  onClick={() => setAttendConfirm(true)}
                >
                  Atender
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
