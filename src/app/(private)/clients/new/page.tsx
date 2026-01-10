"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Save, MapPin, User, StickyNote } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { ApiError } from "@/shared/http/apiError";

import { useZonesCatalog } from "@/features/catalogs/hooks/useCatalogs";
import {
  clientsApi,
  type ClientCreateRequest,
} from "@/features/clients/api/clientsApi";

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

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
      <span className="font-semibold">Error:</span>{" "}
      <span className="text-[color:var(--muted)]">{message}</span>
    </div>
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const zones = useZonesCatalog();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Zona: 2 modos (catálogo o libre)
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [zoneLabel, setZoneLabel] = useState(""); // texto mostrado en autocomplete
  const [zoneText, setZoneText] = useState(""); // zona libre

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zoneItems = useMemo(
    () =>
      zones.items.map((z) => ({
        id: z.id,
        label: z.name,
        subLabel: z.normalizedName,
      })),
    [zones.items]
  );

  const firstNameOk = firstName.trim().length >= 2;
  const lastNameOk = lastName.trim().length >= 2;

  const canSubmit = firstNameOk && lastNameOk && !saving;

  async function onSubmit() {
    if (!canSubmit) return;
    if (saving) return;

    setSaving(true);
    setError(null);

    const payload: ClientCreateRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      notes: notes.trim() ? notes.trim() : null,
      zoneId: zoneId,
      zoneText: null,
    };

    // Si no hay zoneId, usamos zona libre si existe
    if (zoneId == null) {
      payload.zoneText = zoneText.trim() ? zoneText.trim() : null;
    }

    try {
      const res = await clientsApi.create(payload);
      const createdId = res.data.id;

      // UX: ir al detalle del cliente recién creado
      router.push(`/clients/${createdId}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo crear el cliente";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Nuevo cliente</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Registra una persona y su zona. Luego podrás agregar teléfonos y
            mascotas.
          </p>
        </div>

        <Link href="/clients">
          <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
            Volver
          </Button>
        </Link>
      </Card>

      {error && <ErrorBox message={error} />}

      {/* Form */}
      <Card className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* FirstName */}
          <div className="space-y-1">
            <FieldLabel>
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" /> Nombres
              </span>
            </FieldLabel>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Ana"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            />
            <Helper>Min 2 caracteres.</Helper>
          </div>

          {/* LastName */}
          <div className="space-y-1">
            <FieldLabel>Apellidos</FieldLabel>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Pérez"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            />
            <Helper>Min 2 caracteres.</Helper>
          </div>
        </div>

        {/* Zona catálogo / libre */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-end">
          <div className="space-y-1">
            <AutocompleteInput
              label="Zona (catálogo)"
              placeholder="Busca una zona..."
              items={zoneItems}
              value={zoneLabel}
              onChange={(text) => {
                setZoneLabel(text);

                // si borran, limpiamos selección (y dejan libre el campo zonaText)
                if (!text.trim()) setZoneId(null);
              }}
              onPick={(item) => {
                setZoneId(Number(item.id));
                setZoneLabel(item.label);

                // al elegir catálogo, anulamos zona libre
                setZoneText("");
              }}
              disabled={zones.loading || saving}
            />
            <Helper>
              Si seleccionas una zona del catálogo, se guardará como{" "}
              <b>zoneId</b>.
            </Helper>
          </div>

          <div className="space-y-1">
            <FieldLabel>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Zona libre (opcional)
              </span>
            </FieldLabel>
            <input
              value={zoneText}
              onChange={(e) => {
                const v = e.target.value;
                setZoneText(v);

                // si escribe zona libre, anulamos selección catálogo
                if (v.trim().length > 0) {
                  setZoneId(null);
                  setZoneLabel("");
                }
              }}
              placeholder="Ej: Urbanización / Referencia"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              disabled={saving}
            />
            <Helper>
              Úsalo si no existe en catálogo. Se guardará como <b>zoneText</b>.
            </Helper>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <FieldLabel>
            <span className="inline-flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Notas (opcional)
            </span>
          </FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del cliente..."
            rows={4}
            className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                       px-3 py-2 text-sm outline-none transition-all duration-200
                       focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            disabled={saving}
          />
          <Helper>Ej: “Solo puede en las mañanas”, “Perro nervioso”, etc.</Helper>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/clients">
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
            {saving ? "Guardando..." : "Crear cliente"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
