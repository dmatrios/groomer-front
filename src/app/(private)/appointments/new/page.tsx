// src/app/(private)/appointments/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Save,
  PawPrint,
  CalendarPlus,
  StickyNote,
  AlertTriangle,
  Search,
  X,
  Clock,
  Info,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Modal } from "@/shared/ui/components/Modal";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";
import { ApiError } from "@/shared/http/apiError"; // si te falla por mayúsculas: "@/shared/http/ApiError"

import {
  appointmentsApi,
  type AppointmentCreateRequest,
} from "@/features/appointments/api/appointmentsApi";

import { toIsoLocal } from "@/features/appointments/utils/dates";
import { usePetPicker } from "@/features/appointments/hooks/usePetPicker";
import type { PetResponse } from "@/features/pets/api/petsApi";

/* =========================
   UI helpers
========================= */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[color:var(--muted)]">{children}</p>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function toPayloadDateTime(value: string) {
  // datetime-local: "YYYY-MM-DDTHH:mm" => backend: "YYYY-MM-DDTHH:mm:ss"
  return value?.length === 16 ? `${value}:00` : value;
}

function minutesBetween(startAt: string, endAt: string) {
  // startAt/endAt vienen como datetime-local => parseable como Date
  const s = new Date(startAt);
  const e = new Date(endAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

/* =========================
   Page
========================= */

export default function NewAppointmentPage() {
  const router = useRouter();

  // ✅ Picker de mascotas (search)
  const pets = usePetPicker();
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return toIsoLocal(d).slice(0, 16);
  });

  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    return toIsoLocal(d).slice(0, 16);
  });

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // Modal de errores (incluye 409 overlap)
  const errModal = useErrorModal();
  const [pendingConfirm, setPendingConfirm] = useState<null | (() => Promise<void>)>(null);

  const timeOk = useMemo(() => {
    if (!startAt || !endAt) return false;
    return endAt > startAt;
  }, [startAt, endAt]);

  const durationMins = useMemo(() => {
    if (!timeOk) return null;
    return minutesBetween(startAt, endAt);
  }, [startAt, endAt, timeOk]);

  const canSubmit = Boolean(selectedPet?.id) && timeOk && !saving;

  async function tryCreate(payload: AppointmentCreateRequest, forceOverlap: boolean) {
    const res = await appointmentsApi.create(payload, { forceOverlap });
    return res.data;
  }

  function selectPet(p: PetResponse) {
    setSelectedPet(p);
    pets.setQuery(`${p.name} (${p.code})`);
    setOpenDropdown(false);

    // UX: dejar el cursor fuera y no reabrir
    requestAnimationFrame(() => inputRef.current?.blur());
  }

  function clearPet() {
    setSelectedPet(null);
    pets.setQuery("");
    setOpenDropdown(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function onSubmit() {
    if (!canSubmit || !selectedPet) return;

    setSaving(true);
    setPendingConfirm(null);

    const payload: AppointmentCreateRequest = {
      petId: Number(selectedPet.id),
      startAt: toPayloadDateTime(startAt),
      endAt: toPayloadDateTime(endAt),
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      const created = await tryCreate(payload, false);
      router.push(`/appointments/${created.id}`);
      return;
    } catch (err) {
      // solapamiento: 409 => mostramos modal con confirmación
      if (err instanceof ApiError && err.status === 409) {
        errModal.show(err, "Conflicto de horario");

        setPendingConfirm(() => async () => {
          const created = await tryCreate(payload, true);
          router.push(`/appointments/${created.id}`);
        });

        setSaving(false);
        return;
      }

      errModal.show(err, "No se pudo crear la cita");
      setSaving(false);
    }
  }

  // ✅ cerrar dropdown al click fuera (sin overlay)
  useEffect(() => {
    if (!openDropdown) return;

    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      if (!t) return;

      const box = dropdownRef.current;
      const input = inputRef.current;

      if (box?.contains(t) || input?.contains(t)) return;
      setOpenDropdown(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openDropdown]);

  // ✅ si el usuario escribe, invalidamos la selección (evita “creo cita con mascota vieja”)
  useEffect(() => {
    // si el query coincide exactamente con el “formato seleccionado” mantenemos
    // caso contrario, si el usuario empieza a editar, soltamos selección
    if (!selectedPet) return;
    const expected = `${selectedPet.name} (${selectedPet.code})`;
    if (pets.query !== expected) setSelectedPet(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets.query]);

  const titleRight = useMemo(() => {
    if (!selectedPet) return <Chip>Sin mascota</Chip>;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip>
          <PawPrint className="mr-1 h-4 w-4" />
          {selectedPet.name}
        </Chip>
        <Chip>Código: {selectedPet.code}</Chip>
        <Chip>Cliente #{selectedPet.clientId}</Chip>
      </div>
    );
  }, [selectedPet]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Nueva cita</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Agenda una cita para una mascota. Validamos hora y manejamos solapamientos (409) con confirmación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/appointments">
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>
        </div>
      </Card>

      {/* Resumen compacto */}
      <Card className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[color:var(--muted)]" />
            <div className="text-sm font-semibold">Resumen</div>
          </div>
          {titleRight}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip>
            <Clock className="mr-1 h-4 w-4" />
            {timeOk && durationMins != null ? `${durationMins} min` : "Duración —"}
          </Chip>
          <Chip>
            Inicio: <span className="ml-1 font-semibold">{startAt || "—"}</span>
          </Chip>
          <Chip>
            Fin: <span className="ml-1 font-semibold">{endAt || "—"}</span>
          </Chip>
        </div>
      </Card>

      {/* Form */}
      <Card className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Mascota picker */}
          <div className="lg:col-span-2">
            <FieldLabel>
              <PawPrint className="inline h-4 w-4 mr-1" />
              Mascota
            </FieldLabel>

            <div className="relative mt-1">
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                <Search className="h-4 w-4 text-[color:var(--muted)]" />
                <input
                  ref={inputRef}
                  value={pets.query}
                  onChange={(e) => {
                    pets.setQuery(e.target.value);
                    setOpenDropdown(true);
                  }}
                  onFocus={() => setOpenDropdown(true)}
                  placeholder="Buscar por nombre, código (PET-...), id o cliente..."
                  className="w-full bg-transparent text-sm outline-none"
                  autoComplete="off"
                />
                {pets.query && (
                  <button
                    type="button"
                    onClick={clearPet}
                    className="rounded-lg p-1 transition-all duration-200 hover:shadow-sm"
                    aria-label="Limpiar"
                    title="Limpiar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!selectedPet && (
                <Helper>Selecciona una mascota de la lista para habilitar “Crear cita”.</Helper>
              )}

              {/* Dropdown */}
              {openDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm"
                >
                  <div className="max-h-72 overflow-auto p-2">
                    {pets.loading ? (
                      <div className="p-3 text-sm text-[color:var(--muted)]">Cargando mascotas...</div>
                    ) : pets.error ? (
                      <div className="p-3 text-sm">
                        <div className="font-semibold">Error</div>
                        <div className="text-[color:var(--muted)]">{pets.error}</div>
                        <div className="mt-2">
                          <Button variant="secondaryOutline" type="button" onClick={pets.refresh}>
                            Reintentar
                          </Button>
                        </div>
                      </div>
                    ) : pets.items.length === 0 ? (
                      <div className="p-3 text-sm text-[color:var(--muted)]">Sin resultados.</div>
                    ) : (
                      <div className="space-y-1">
                        {pets.items.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPet(p)}
                            className="w-full rounded-xl border border-transparent px-3 py-2 text-left transition-all duration-200 hover:border-[color:var(--border)] hover:shadow-sm"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{p.name}</div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                                <span>#{p.id}</span>
                                <span>·</span>
                                <span>{p.code}</span>
                                <span>·</span>
                                <span>Cliente #{p.clientId}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-2">
                    <span className="text-xs text-[color:var(--muted)]">
                      Mostrando hasta 50 (total: {pets.total})
                    </span>
                    <Button variant="secondaryOutline" type="button" onClick={() => setOpenDropdown(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Start */}
          <div>
            <FieldLabel>
              <CalendarPlus className="inline h-4 w-4 mr-1" />
              Inicio
            </FieldLabel>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
            />
          </div>

          {/* End */}
          <div>
            <FieldLabel>Fin</FieldLabel>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
            />

            {!timeOk ? (
              <Helper>La hora fin debe ser mayor que la hora inicio.</Helper>
            ) : durationMins != null ? (
              <Helper>Duración estimada: {durationMins} minutos.</Helper>
            ) : null}
          </div>

          {/* Notes */}
          <div className="lg:col-span-2">
            <FieldLabel>
              <StickyNote className="inline h-4 w-4 mr-1" />
              Notas
            </FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              placeholder="Opcional... (ej: ‘Llega 10 min tarde’, ‘corte + baño’, ‘alergia’)"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <AlertTriangle className="h-4 w-4" />
            Si hay solapamiento, te pedirá confirmación (forceOverlap=true).
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/appointments">
              <Button variant="secondaryOutline" type="button" disabled={saving}>
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
              {saving ? "Guardando..." : "Crear cita"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: errores y confirmación 409 */}
      <Modal
        open={errModal.state.open}
        title={errModal.state.title}
        description="Revisa el detalle para entender qué pasó."
        primaryText={errModal.state.status === 409 ? "Confirmar y crear" : undefined}
        onPrimary={
          errModal.state.status === 409
            ? async () => {
                if (!pendingConfirm) return;

                setSaving(true);
                try {
                  await pendingConfirm();
                } catch (e) {
                  errModal.show(e, "No se pudo completar la acción");
                } finally {
                  setSaving(false);
                  errModal.close();
                  setPendingConfirm(null);
                }
              }
            : undefined
        }
        onClose={() => {
          errModal.close();
          setPendingConfirm(null);
        }}
        busy={saving}
      >
        <div className="space-y-2">
          <div className="font-semibold">Detalle</div>

          {/* Nota: mostramos el mensaje del error modal (si tu hook lo expone),
             si no, dejamos el texto general */}
          <div className="text-[color:var(--muted)]">
            Hay un conflicto de horario con otra cita. Si confirmas, se registrará igualmente.
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
            Tip: esta confirmación equivale a enviar <span className="font-semibold">forceOverlap=true</span>.
          </div>
        </div>
      </Modal>
    </div>
  );
}
