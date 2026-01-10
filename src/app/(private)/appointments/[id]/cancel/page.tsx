// src/app/(private)/appointments/[id]/cancel/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, Ban, DollarSign } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { ApiError } from "@/shared/http/apiError"; // si te falla casing: "@/shared/http/ApiError"

import { appointmentsApi, type AppointmentCancelRequest } from "@/features/appointments/api/appointmentsApi";
import { useAppointmentDetail } from "@/features/appointments/hooks/useAppointmentDetail";
import { appointmentStatusUI } from "@/features/appointments/ui/appointmentStatusUI";
import { Badge } from "@/shared/ui/components/Badge";
import { formatDateLabel, formatTimeHHmm } from "@/features/appointments/utils/dates";

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

export default function CancelAppointmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { item, loading, error } = useAppointmentDetail(id);

  const [reason, setReason] = useState("");
  const [chargeMethod, setChargeMethod] = useState<string | null>(null);
  const [chargeAmount, setChargeAmount] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!item) return false;
    if (item.status !== "PENDING") return false;
    if (!reason.trim()) return false;
    if (saving) return false;
    return true;
  }, [item, reason, saving]);

  async function onSubmit() {
    if (!item || !canSubmit) return;

    setSaving(true);
    setSubmitError(null);

    const amount =
      chargeAmount.trim() === "" ? null : Number(chargeAmount.trim());

    const payload: AppointmentCancelRequest = {
      reason: reason.trim(),
      chargeMethod: chargeMethod ?? null,
      chargeAmount: Number.isFinite(amount as number) ? amount : null,
    };

    try {
      await appointmentsApi.cancel(item.id, payload);
      router.push(`/appointments/${item.id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo cancelar la cita";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  const header = useMemo(() => {
    if (!item) return null;
    const day = item.startAt.slice(0, 10);
    const d = new Date(`${day}T00:00:00`);
    return {
      date: formatDateLabel(d),
      time: `${formatTimeHHmm(item.startAt)} – ${formatTimeHHmm(item.endAt)}`,
      ui: appointmentStatusUI[item.status],
    };
  }, [item]);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cancelar cita</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Requiere motivo. Puede registrar cargo opcional.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/appointments/${id}`}>
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}
      {submitError && <ErrorBox message={submitError} />}

      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !item ? null : item.status !== "PENDING" ? (
        <Card className="p-6 text-sm text-[color:var(--muted)]">
          Solo se puede cancelar una cita <b>PENDIENTE</b>.
        </Card>
      ) : (
        <Card className="space-y-5">
          {header && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                #{item.id} · {header.date} · {header.time}
              </div>
              <Badge variant={header.ui.variant}>{header.ui.label}</Badge>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <FieldLabel>
                <Ban className="inline h-4 w-4 mr-1" />
                Motivo (obligatorio)
              </FieldLabel>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                placeholder="Ej: El cliente canceló / No asistió / etc."
              />
            </div>

            <div>
              <FieldLabel>
                <DollarSign className="inline h-4 w-4 mr-1" />
                Método de cargo (opcional)
              </FieldLabel>
              <select
                value={chargeMethod ?? ""}
                onChange={(e) => setChargeMethod(e.target.value ? e.target.value : null)}
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              >
                <option value="">— Sin cargo —</option>
                <option value="CASH">Efectivo</option>
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
              <div className="mt-1 text-xs text-[color:var(--muted)]">
                Ajusta estos valores cuando definamos catálogo/métodos.
              </div>
            </div>

            <div>
              <FieldLabel>Monto (opcional)</FieldLabel>
              <input
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Ej: 20"
                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link href={`/appointments/${id}`}>
              <Button variant="secondaryOutline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button
              variant="primary"
              icon={Save}
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              Confirmar cancelación
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
