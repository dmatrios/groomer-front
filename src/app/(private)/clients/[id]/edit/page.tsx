"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, MapPin, User, StickyNote } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { ApiError } from "@/shared/http/apiError";

import { clientsApi, type ClientCreateRequest, type ClientResponse } from "@/features/clients/api/clientsApi";
import { useZonesCatalog } from "@/features/catalogs/hooks/useCatalogs";

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
      <span className="font-semibold">Error:</span>{" "}
      <span className="text-[color:var(--muted)]">{message}</span>
    </div>
  );
}

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

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clientId = Number(params.id);

  const zones = useZonesCatalog();
  const zoneMap = useMemo(() => {
    const map = new Map<number, string>();
    zones.items.forEach((z) => map.set(z.id, z.name));
    return map;
  }, [zones.items]);

  const zoneItems = useMemo(
    () =>
      zones.items.map((z) => ({
        id: z.id,
        label: z.name,
        subLabel: z.normalizedName,
      })),
    [zones.items]
  );

  const [client, setClient] = useState<ClientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [zoneId, setZoneId] = useState<number | null>(null);
  const [zoneLabel, setZoneLabel] = useState("");
  const [zoneText, setZoneText] = useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      if (!Number.isFinite(clientId)) return;

      setLoading(true);
      setError(null);

      try {
        const res = await clientsApi.getById(clientId);
        const c = res.data;

        setClient(c);
        setFirstName(c.firstName ?? "");
        setLastName(c.lastName ?? "");
        setZoneId(c.zoneId ?? null);

        // si tiene zoneId, pintamos label desde catálogo (cuando esté disponible)
        setZoneLabel(c.zoneId != null ? (zoneMap.get(c.zoneId) ?? "") : "");
        setZoneText(c.zoneText ?? "");
        setNotes(c.notes ?? "");
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "No se pudo cargar el cliente";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // cuando carguen las zonas, si hay zoneId y no hay label, lo calculamos
  useEffect(() => {
    if (zoneId != null && !zoneLabel) {
      const name = zoneMap.get(zoneId);
      if (name) setZoneLabel(name);
    }
  }, [zoneId, zoneLabel, zoneMap]);

  const firstNameOk = firstName.trim().length >= 2;
  const lastNameOk = lastName.trim().length >= 2;
  const canSubmit = firstNameOk && lastNameOk && !saving;

  async function onSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    const payload: ClientCreateRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      notes: notes.trim() ? notes.trim() : null,
      zoneId,
      zoneText: null,
    };

    if (zoneId == null) {
      payload.zoneText = zoneText.trim() ? zoneText.trim() : null;
    }

    try {
      await clientsApi.update(clientId, payload);
      router.push(`/clients/${clientId}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo actualizar el cliente";
      setError(message);
      setSaving(false);
    }
  }

  if (!Number.isFinite(clientId)) {
    return <ErrorBox message="ID inválido." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Editar cliente</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Actualiza datos del cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/clients/${clientId}`}>
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>

          <Button
            variant="primary"
            icon={Save}
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !client ? (
        <ErrorBox message="Cliente no encontrado." />
      ) : (
        <Card className="space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-1">
              <FieldLabel>
                <span className="inline-flex items-center gap-2">
                  <User className="h-4 w-4" /> Nombres
                </span>
              </FieldLabel>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                           px-3 py-2 text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              />
              <Helper>Min 2 caracteres.</Helper>
            </div>

            <div className="space-y-1">
              <FieldLabel>Apellidos</FieldLabel>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                           px-3 py-2 text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              />
              <Helper>Min 2 caracteres.</Helper>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-end">
            <div className="space-y-1">
              <AutocompleteInput
                label="Zona (catálogo)"
                placeholder="Busca una zona..."
                items={zoneItems}
                value={zoneLabel}
                onChange={(text) => {
                  setZoneLabel(text);
                  if (!text.trim()) setZoneId(null);
                }}
                onPick={(item) => {
                  setZoneId(Number(item.id));
                  setZoneLabel(item.label);
                  setZoneText("");
                }}
                disabled={zones.loading}
              />
              <Helper>
                Si seleccionas una zona del catálogo, se guarda como <b>zoneId</b>.
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
                  setZoneText(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setZoneId(null);
                    setZoneLabel("");
                  }
                }}
                placeholder="Ej: Urbanización X / Referencia"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                           px-3 py-2 text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              />
              <Helper>
                Úsalo si no existe en catálogo. Se guarda como <b>zoneText</b>.
              </Helper>
            </div>
          </div>

          <div className="space-y-1">
            <FieldLabel>
              <span className="inline-flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Notas (opcional)
              </span>
            </FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            />
            <Helper>Ej: “Solo mañanas”, etc.</Helper>
          </div>
        </Card>
      )}
    </div>
  );
}
