"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  Hash,
  Pencil,
  Eye,
  Search,
  X,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";

import { useZonesCatalog } from "@/features/catalogs/hooks/useCatalogs";
import { useClientsList } from "@/features/clients/hooks/useClients";

type ViewMode = "list" | "grid";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function formatZone(
  client: { zoneText: string | null; zoneId: number | null },
  zoneName?: string
) {
  if (client.zoneText && client.zoneText.trim().length > 0) return client.zoneText;
  if (zoneName) return zoneName;
  if (client.zoneId != null) return `Zona #${client.zoneId}`;
  return "Sin zona";
}

export default function ClientsPage() {
  const clients = useClientsList();
  const zones = useZonesCatalog();

  const [view, setView] = useState<ViewMode>("grid");

  // ✅ Buscador por nombre/apellido/código (MVP local)
  const [searchText, setSearchText] = useState("");

  // ✅ filtro zona (local + server)
  const [zoneText, setZoneText] = useState(""); // texto del input
  const [zoneId, setZoneId] = useState<number | undefined>(clients.zoneId); // id real

  // Persistimos la vista (UX pro)
  useEffect(() => {
    const saved = localStorage.getItem("clients.view") as ViewMode | null;
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("clients.view", view);
  }, [view]);

  // Mapa id->nombre para mostrar zona bonita
  const zoneMap = useMemo(() => {
    const map = new Map<number, string>();
    zones.items.forEach((z) => map.set(z.id, z.name));
    return map;
  }, [zones.items]);

  const zoneAutocomplete = useMemo(
    () =>
      zones.items.map((z) => ({
        id: z.id,
        label: z.name,
        subLabel: z.normalizedName,
      })),
    [zones.items]
  );

  // ✅ Mantener input de zona sincronizado si el hook ya trae zoneId
  useEffect(() => {
    const zid = clients.zoneId;
    if (zid == null) return;
    setZoneId(zid);
    setZoneText(zoneMap.get(zid) ?? "");
  }, [clients.zoneId, zoneMap]);

  // ✅ Cuando cambia zoneId local, actualizamos hook + reseteamos página
  useEffect(() => {
    if (zoneId === clients.zoneId) return;
    clients.setZoneId(zoneId);
    clients.setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  // ✅ Paginación sin TS error (meta podría venir incompleto al inicio)
  const meta = clients.meta;

  const page = meta?.page ?? 0;
  const totalPages = meta?.totalPages ?? 0;

  const canPrev = page > 0;
  const canNext = totalPages > 0 ? page + 1 < totalPages : false;

  const total = meta?.totalElements ?? 0;
  const size = meta?.size ?? clients.size;

  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);

  // ✅ Filtrado local por texto + zona (sobre la página actual)
  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    return clients.items.filter((c) => {
      // texto
      const okText = !q
        ? true
        : (() => {
            const full1 = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
            const full2 = `${c.lastName ?? ""} ${c.firstName ?? ""}`.toLowerCase();
            const code = `${c.code ?? ""}`.toLowerCase();
            return full1.includes(q) || full2.includes(q) || code.includes(q);
          })();

      if (!okText) return false;

      // zona (si hay zoneId seleccionado)
      if (zoneId == null) return true;
      return Number(c.zoneId) === Number(zoneId);
    });
  }, [clients.items, searchText, zoneId]);

  const filteredCount = filteredItems.length;

  function clearZoneFilter() {
    setZoneId(undefined);
    setZoneText("");
    clients.setZoneId(undefined);
    clients.setPage(0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Clientes</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Gestiona personas, teléfonos y sus mascotas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
            <Button
              variant={view === "list" ? "primaryOutline" : "ghost"}
              icon={List}
              type="button"
              onClick={() => setView("list")}
              className="px-3"
            >
              Lista
            </Button>
            <Button
              variant={view === "grid" ? "primaryOutline" : "ghost"}
              icon={LayoutGrid}
              type="button"
              onClick={() => setView("grid")}
              className="px-3"
            >
              Grid
            </Button>
          </div>

          <Link href="/clients/new">
            <Button variant="primary" icon={UserPlus} type="button">
              Nuevo cliente
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="space-y-4">
        {/* ✅ Buscador principal + filtro zona */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar cliente
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nombre, apellido o código..."
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                           px-3 py-2 text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              />

              <Button
                variant="ghost"
                icon={X}
                type="button"
                onClick={() => setSearchText("")}
                disabled={!searchText.trim()}
                className="px-3"
                aria-label="Limpiar búsqueda"
                title="Limpiar"
              >
                Limpiar
              </Button>
            </div>

            <div className="text-xs text-[color:var(--muted)]">
              Filtra en la página actual (MVP). Luego lo hacemos server-side.
            </div>
          </div>

          <div className="w-full space-y-2">
            <AutocompleteInput
              label="Filtrar por zona (opcional)"
              placeholder="Escribe para buscar una zona..."
              items={zoneAutocomplete}
              value={zoneText}
              onChange={(text) => {
                setZoneText(text);

                // si el usuario borra el input -> limpiar filtro real
                if (!text.trim()) {
                  setZoneId(undefined);
                  clients.setZoneId(undefined);
                  clients.setPage(0);
                }
              }}
              onPick={(item) => {
                const zid = Number(item.id);
                setZoneId(zid);
                setZoneText(item.label); // importantísimo: mantener label visible
              }}
              disabled={zones.loading}
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-[color:var(--muted)]">
                Tip: borra el input para ver todas las zonas.
              </div>

              {(zoneId != null || zoneText.trim()) && (
                <Button variant="secondaryOutline" type="button" onClick={clearZoneFilter}>
                  Quitar filtro zona
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Paginación + contador */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Chip>
            {total === 0
              ? "0 resultados"
              : searchText.trim() || zoneId != null
              ? `Mostrando ${filteredCount} resultado(s) en esta página (de ${from}–${to} / ${total})`
              : `Mostrando ${from}–${to} de ${total}`}
          </Chip>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondaryOutline"
              icon={ChevronLeft}
              type="button"
              onClick={() => clients.setPage(page - 1)}
              disabled={!canPrev}
            >
              Anterior
            </Button>

            <Button
              variant="secondaryOutline"
              icon={ChevronRight}
              type="button"
              onClick={() => clients.setPage(page + 1)}
              disabled={!canNext}
            >
              Siguiente
            </Button>
          </div>
        </div>

        {clients.error && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{clients.error}</span>
          </div>
        )}
      </Card>

      {/* Contenido */}
      {clients.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">
            No hay clientes (con el filtro actual).
          </div>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((c) => {
            const zoneName = c.zoneId != null ? zoneMap.get(c.zoneId) : undefined;

            const clientId = Number(c.id);
            const safe = Number.isFinite(clientId);

            return (
              <Card key={c.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">
                      {c.lastName}, {c.firstName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" /> {c.code}
                        </span>
                      </Chip>

                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {formatZone(c, zoneName)}
                        </span>
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                    <FileText className="h-4 w-4" />
                    Notas
                  </div>
                  <div className="mt-1 line-clamp-3 text-[color:var(--muted)]">
                    {c.notes?.trim() ? c.notes : "—"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/clients/${encodeURIComponent(String(clientId))}`} aria-disabled={!safe}>
                    <Button variant="secondaryOutline" icon={Eye} type="button" disabled={!safe}>
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/clients/${encodeURIComponent(String(clientId))}/edit`} aria-disabled={!safe}>
                    <Button variant="primaryOutline" icon={Pencil} type="button" disabled={!safe}>
                      Editar
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((c) => {
            const zoneName = c.zoneId != null ? zoneMap.get(c.zoneId) : undefined;

            const clientId = Number(c.id);
            const safe = Number.isFinite(clientId);

            return (
              <Card key={c.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {c.lastName}, {c.firstName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Chip>
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" /> {c.code}
                      </span>
                    </Chip>
                    <Chip>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {formatZone(c, zoneName)}
                      </span>
                    </Chip>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link href={`/clients/${encodeURIComponent(String(clientId))}`} aria-disabled={!safe}>
                    <Button variant="secondaryOutline" icon={Eye} type="button" disabled={!safe}>
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/clients/${encodeURIComponent(String(clientId))}/edit`} aria-disabled={!safe}>
                    <Button variant="primaryOutline" icon={Pencil} type="button" disabled={!safe}>
                      Editar
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
