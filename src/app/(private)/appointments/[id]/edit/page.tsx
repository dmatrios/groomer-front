// src/app/(private)/appointments/[id]/edit/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, Pencil, AlertTriangle } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { ApiError } from "@/shared/http/apiError"; // si te falla casing: "@/shared/http/ApiError"

import { appointmentsApi, type AppointmentUpdateRequest } from "@/features/appointments/api/appointmentsApi";
import { useAppointmentDetail } from "@/features/appointments/hooks/useAppointmentDetail";
import { appointmentStatusUI } from "@/features/appointments/ui/appointmentStatusUI";
import { Badge } from "@/shared/ui/components/Badge";
import { toIsoLocal } from "@/features/appointments/utils/dates";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-[color:var(--muted)]">{children}</label>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
      <span className="font-semibold">Error:</span>{" "}
      <span className="text-[color:var(--muted)]">{message}</span>
    </div>
  );
}

export default function EditAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { item, loading, error } = useAppointmentDetail(id);

  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [overlapPayload, setOverlapPayload] =
    useState<AppointmentUpdateRequest | null>(null);

  // Inicializa con valores actuales cuando llegue item
  useMemo(() => {
    if (!item) return;
    if (!startAt) setStartAt(toIsoLocal(new Date(item.startAt)).slice(0, 16));
    if (!endAt) setEndAt(toIsoLocal(new Date(item.endAt)).slice(0, 16));
    if (notes === "") setNotes(item.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const timeOk = useMemo(() => {
    if (!startAt || !endAt) return false;
    return endAt > startAt;
  }, [startAt, endAt]);

  const canSubmit = useMemo(() => {
    if (!item) return false;
    if (item.status !== "PENDING") return false;
    if (!timeOk) return false;
    if (saving) return false;
    return true;
  }, [item, timeOk, saving]);

  async function tryUpdate(payload: AppointmentUpdateRequest, forceOverlap: boolean) {
    const res = await appointmentsApi.update(id, payload, { forceOverlap });
    return res.data;
  }

  async function onSubmit() {
    if (!item || !canSubmit) return;

    setSaving(true);
    setSubmitError(null);
    setOverlapPayload(null);

    const payload: AppointmentUpdateRequest = {
      startAt: startAt.length === 16 ? `${startAt}:00` : startAt,
      endAt: endAt.length === 16 ? `${endAt}:00` : endAt,
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      await tryUpdate(payload, false);
      router.push(`/appointments/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setOverlapPayload(payload);
        setSaving(false);
        return;
      }

      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo actualizar";
      setSubmitError(msg);
      setSaving(false);
    }
  }

  async function confirmOverlap() {
    if (!overlapPayload) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await tryUpdate(overlapPayload, true);
      router.push(`/appointments/${id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo actualizar";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Editar cita</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Ajusta horario y notas (solo si está PENDIENTE).
          </p>
        </div>

        <Link href={`/appointments/${id}`}>
          <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
            Volver
          </Button>
        </Link>
      </Card>

      {error && <ErrorBox message={error} />}
      {submitError && <ErrorBox message={submitError} />}

      {overlapPayload && (
        <Card className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Solapamiento detectado</div>
              <div className="text-sm text-[color:var(--muted)]">
                ¿Deseas guardar de todas formas?
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondaryOutline"
              type="button"
              onClick={() => setOverlapPayload(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={confirmOverlap} disabled={saving}>
              Confirmar
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !item ? null : item.status !== "PENDING" ? (
        <Card className="p-6 text-sm text-[color:var(--muted)]">
          Solo se puede editar una cita <b>PENDIENTE</b>.
        </Card>
      ) : (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">#{item.id} · Mascota #{item.petId}</div>
            <Badge variant={appointmentStatusUI[item.status].variant}>
              {appointmentStatusUI[item.status].label}
            </Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <FieldLabel>
                <Pencil className="inline h-4 w-4 mr-1" />
                Inicio
              </FieldLabel>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <FieldLabel>Fin</FieldLabel>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
              {!timeOk && (
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  La hora fin debe ser mayor.
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <FieldLabel>Notas</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                placeholder="Opcional..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link href={`/appointments/${id}`}>
              <Button variant="secondaryOutline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button variant="primary" icon={Save} type="button" onClick={onSubmit} disabled={!canSubmit}>
              Guardar cambios
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
