"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  PawPrint,
  Search,
  User,
  CheckCircle2,
  X,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { ApiError } from "@/shared/http/apiError";

import {
  petsApi,
  type PetCreateRequest,
  type PetSize,
  type PetSpecies,
  type PetTemperament,
} from "@/features/pets/api/petsApi";

import {
  clientsApi,
  type ClientResponse,
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function formatClientShort(c: ClientResponse) {
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : "";
  return `${first} ${lastInitial}`.trim();
}

export default function NewPetPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const from = sp.get("from");
  const clientIdParam = sp.get("clientId");

  const backHref = useMemo(() => {
    if (from) return from;
    if (clientIdParam) return `/clients/${clientIdParam}`;
    return "/pets";
  }, [from, clientIdParam]);

  const initialClientId = useMemo(() => {
    const n = clientIdParam ? Number(clientIdParam) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [clientIdParam]);

  // -----------------------------
  // Cliente seleccionado
  // -----------------------------
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(
    null
  );

  // si viene clientId por URL, cargamos el cliente
  useEffect(() => {
    let mounted = true;

    async function loadClientById(id: number) {
      try {
        const res = await clientsApi.getById(id);
        if (!mounted) return;
        setSelectedClient(res.data ?? null);
      } catch {
        if (!mounted) return;
        setSelectedClient(null);
      }
    }

    if (initialClientId != null) loadClientById(initialClientId);

    return () => {
      mounted = false;
    };
  }, [initialClientId]);

  // -----------------------------
  // Selector de clientes (si no hay seleccionado)
  // -----------------------------
  const [clientPickerOpen, setClientPickerOpen] = useState<boolean>(
    initialClientId == null
  );
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const [clientPage, setClientPage] = useState(0);
  const [clientItems, setClientItems] = useState<ClientResponse[]>([]);
  const [clientQuery, setClientQuery] = useState(""); // filtro local (sobre page actual)

  useEffect(() => {
    if (!clientPickerOpen) return;

    let mounted = true;

    async function loadClients() {
      setClientLoading(true);
      setClientError(null);

      try {
        const res = await clientsApi.list({ page: clientPage, size: 10, sort: "lastName" });
        if (!mounted) return;

        setClientItems(res.data ?? []);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "No se pudo cargar clientes";
        if (!mounted) return;
        setClientError(msg);
        setClientItems([]);
      } finally {
        if (mounted) setClientLoading(false);
      }
    }

    loadClients();
    return () => {
      mounted = false;
    };
  }, [clientPickerOpen, clientPage]);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clientItems;

    return clientItems.filter((c) => {
      const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      const code = (c.code ?? "").toLowerCase();
      return full.includes(q) || code.includes(q) || String(c.id).includes(q);
    });
  }, [clientItems, clientQuery]);

  function pickClient(c: ClientResponse) {
    setSelectedClient(c);
    setClientPickerOpen(false);

    // ✅ dejamos clientId en la URL para persistencia al refrescar
    const url = new URL(window.location.href);
    url.searchParams.set("clientId", String(c.id));
    if (from) url.searchParams.set("from", from);
    router.replace(url.pathname + "?" + url.searchParams.toString());
  }

  function clearClient() {
    setSelectedClient(null);
    setClientPickerOpen(true);
    setClientQuery("");
    setClientPage(0);

    // ✅ limpiamos clientId en URL
    const url = new URL(window.location.href);
    url.searchParams.delete("clientId");
    if (from) url.searchParams.set("from", from);
    router.replace(url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : ""));
  }

  // -----------------------------
  // Form mascota
  // -----------------------------
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("DOG");
  const [size, setSize] = useState<PetSize>("SMALL");
  const [temperament, setTemperament] = useState<PetTemperament>("CALM");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = name.trim().length >= 2;
  const clientOk = !!selectedClient?.id;
  const canSubmit = clientOk && nameOk && !saving;

  async function onSave() {
    if (!canSubmit || !selectedClient) return;

    setSaving(true);
    setError(null);

    const payload: PetCreateRequest = {
      clientId: selectedClient.id,
      name: name.trim(),
      species,
      size,
      temperament,
      weight: weight.trim() ? Number(weight) : null,
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      const res = await petsApi.create(payload);
      const createdId = res.data?.id;

      const finalBack =
        from ? from : selectedClient?.id ? `/clients/${selectedClient.id}` : "/pets";

      if (createdId) {
        router.push(`/pets/${createdId}?from=${encodeURIComponent(finalBack)}`);
      } else {
        router.push(`/pets?from=${encodeURIComponent(finalBack)}`);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo crear la mascota";
      setError(msg);
      setSaving(false);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Nueva mascota</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Selecciona un cliente y registra la mascota.
          </p>
        </div>

        <Link href={backHref}>
          <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
            Volver
          </Button>
        </Link>
      </Card>

      {(error || clientError) && <ErrorBox message={(error ?? clientError)!} />}

      {/* Cliente seleccionado / selector */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Cliente</div>
            <div className="text-sm text-[color:var(--muted)]">
              {selectedClient ? (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {formatClientShort(selectedClient)}{" "}
                  <span className="text-xs">({selectedClient.code})</span>
                </span>
              ) : (
                "No hay cliente seleccionado."
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedClient ? (
              <>
                <Link href={`/clients/${selectedClient.id}`}>
                  <Button variant="secondaryOutline" icon={User} type="button">
                    Ver cliente
                  </Button>
                </Link>

                <Button
                  variant="secondaryOutline"
                  icon={X}
                  type="button"
                  onClick={clearClient}
                >
                  Cambiar
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                icon={User}
                type="button"
                onClick={() => setClientPickerOpen(true)}
              >
                Elegir cliente
              </Button>
            )}
          </div>
        </div>

        {clientPickerOpen && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div className="space-y-1">
                <FieldLabel>Buscar (nombre, código o id)</FieldLabel>
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                  <Search className="h-4 w-4 text-[color:var(--muted)]" />
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Ej: Pérez / CL-00012 / 6"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <Helper>
                  *Filtro local sobre esta página. Luego lo hacemos “search real” en backend.
                </Helper>
              </div>

              <Button
                variant="secondaryOutline"
                type="button"
                onClick={() => setClientPage((p) => Math.max(0, p - 1))}
                disabled={clientLoading || clientPage === 0}
              >
                Anterior
              </Button>

              <Button
                variant="secondaryOutline"
                type="button"
                onClick={() => setClientPage((p) => p + 1)}
                disabled={clientLoading}
              >
                Siguiente
              </Button>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <Chip>Página: {clientPage + 1}</Chip>
                <Chip>
                  {clientLoading
                    ? "Cargando..."
                    : `${filteredClients.length} clientes en esta página`}
                </Chip>
              </div>

              <div className="mt-3 space-y-2">
                {clientLoading ? (
                  <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-sm text-[color:var(--muted)]">
                    No hay resultados en esta página con ese filtro.
                  </div>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickClient(c)}
                      className="w-full rounded-2xl border border-[color:var(--border)]
                                 bg-[color:var(--surface)] px-4 py-3 text-left
                                 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {c.lastName}, {c.firstName}
                          </div>
                          <div className="mt-1 text-xs text-[color:var(--muted)]">
                            {c.code} · ID #{c.id}
                          </div>
                        </div>
                        <Chip>Elegir</Chip>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Form mascota */}
      <Card className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1">
            <FieldLabel>
              <span className="inline-flex items-center gap-2">
                <PawPrint className="h-4 w-4" /> Nombre
              </span>
            </FieldLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Luna"
              disabled={!clientOk}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                         disabled:opacity-60"
            />
            <Helper>{clientOk ? "Min 2 caracteres." : "Primero elige un cliente."}</Helper>
          </div>

          <div className="space-y-1">
            <FieldLabel>Especie</FieldLabel>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as PetSpecies)}
              disabled={!clientOk}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                         disabled:opacity-60"
            >
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-1">
            <FieldLabel>Tamaño</FieldLabel>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as PetSize)}
              disabled={!clientOk}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                         disabled:opacity-60"
            >
              <option value="SMALL">SMALL</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LARGE">LARGE</option>
            </select>
          </div>

          <div className="space-y-1">
            <FieldLabel>Temperamento</FieldLabel>
            <select
              value={temperament}
              onChange={(e) => setTemperament(e.target.value as PetTemperament)}
              disabled={!clientOk}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                         disabled:opacity-60"
            >
              <option value="CALM">CALM</option>
              <option value="NORMAL">NORMAL</option>
              <option value="AGGRESSIVE">AGGRESSIVE</option>
            </select>
          </div>

          <div className="space-y-1">
            <FieldLabel>Peso (kg) (opcional)</FieldLabel>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 8.5"
              disabled={!clientOk}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                         px-3 py-2 text-sm outline-none transition-all duration-200
                         focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                         disabled:opacity-60"
            />
          </div>
        </div>

        <div className="space-y-1">
          <FieldLabel>Notas (opcional)</FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Observaciones..."
            disabled={!clientOk}
            className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                       px-3 py-2 text-sm outline-none transition-all duration-200
                       focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                       disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href={backHref}>
            <Button variant="secondaryOutline" type="button">
              Cancelar
            </Button>
          </Link>

          <Button
            variant="primary"
            icon={Save}
            type="button"
            onClick={onSave}
            disabled={!canSubmit}
          >
            {saving ? "Guardando..." : "Crear mascota"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
