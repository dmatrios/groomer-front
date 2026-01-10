"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Hash,
  User,
  Search,
  Eye,
  Pencil,
  Grid3X3,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { assetUrl } from "@/shared/config/asset";

import { usePetsList } from "@/features/pets/hooks/usePetsList";
import { usePetThumbs } from "@/features/pets/hooks/usePetThumbs";

import { clientsApi, type ClientResponse } from "@/features/clients/api/clientsApi";

type ViewMode = "grid" | "list";

/* =========================
   PET SPECIES UI
========================= */

type PetSpecies = "DOG" | "CAT";

const petSpeciesUI: Record<PetSpecies, { label: string }> = {
  DOG: { label: "Perro" },
  CAT: { label: "Gato" },
};

function petSpeciesLabel(species?: string | null) {
  if (!species) return "";
  return petSpeciesUI[species as PetSpecies]?.label ?? String(species);
}

/* =========================
   CLIENT NAME HELPERS
========================= */

function shortClientName(c: ClientResponse) {
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  const lastInitial = last ? `${last[0].toUpperCase()}.` : "";
  return `${first}${lastInitial ? ` ${lastInitial}` : ""}`.trim();
}

/**
 * Carga nombres de clientes por ids (solo los que falten)
 * y deja un map: clientId -> "Juan P."
 */
function useClientNameMap(clientIds: number[]) {
  const [map, setMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const idsKey = useMemo(() => clientIds.slice().sort((a, b) => a - b).join(","), [clientIds]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // ids que no están cacheados aún
      const missing = clientIds.filter((id) => Number.isFinite(id) && map[id] == null);
      if (missing.length === 0) return;

      setLoading(true);
      try {
        const results = await Promise.allSettled(missing.map((id) => clientsApi.getById(id)));

        if (cancelled) return;

        const patch: Record<number, string> = {};
        for (let i = 0; i < results.length; i++) {
          const id = missing[i];
          const r = results[i];

          if (r.status === "fulfilled") {
            const c = r.value.data;
            if (c) patch[id] = shortClientName(c);
          }
        }

        if (Object.keys(patch).length > 0) {
          setMap((prev) => ({ ...prev, ...patch }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // importante: idsKey para disparar al cambiar ids; map para saber qué falta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  function getLabel(clientId?: number | null) {
    if (!clientId) return null;
    return map[clientId] ?? null;
  }

  return { getLabel, loading };
}

/* =========================
   UI
========================= */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

export default function PetsPage() {
  const pets = usePetsList();

  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    const saved = localStorage.getItem("pets.view") as ViewMode | null;
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("pets.view", view);
  }, [view]);

  const canPrev = pets.page > 0;
  const canNext = pets.page + 1 < pets.meta.totalPages;

  // ✅ Pre-carga de miniaturas: si el listado viene con mainPhotoUrl=null,
  // vamos por detalle /pets/{id} y cacheamos.
  const petIds = useMemo(() => pets.items.map((p) => Number(p.id)), [pets.items]);
  const thumbs = usePetThumbs(petIds);

  function getImgSrc(p: { id: number; mainPhotoUrl?: string | null }) {
    const url = p.mainPhotoUrl ?? thumbs.getThumb(Number(p.id));
    return assetUrl(url);
  }

  // ✅ Hidratar nombres de clientes (por la página actual)
  const clientIds = useMemo(() => {
    const set = new Set<number>();
    for (const p of pets.items) {
      const id = Number((p as any).clientId);
      if (Number.isFinite(id)) set.add(id);
    }
    return Array.from(set);
  }, [pets.items]);

  const clientNames = useClientNameMap(clientIds);

  function clientDisplay(p: any) {
    const id = Number(p.clientId);
    const label = clientNames.getLabel(id);
    // Si todavía no cargó, cae a #id
    return label ? `${label}` : `Cliente #${id}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Mascotas</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Listado general para operar rápido (ver, editar, fotos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/pets/board">
            <Button variant="secondaryOutline" icon={Grid3X3} type="button">
              Vista densa
            </Button>
          </Link>

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

          <Button variant="secondaryOutline" icon={RefreshCw} type="button" onClick={pets.refresh}>
            Actualizar
          </Button>

          <Link href="/pets/new">
            <Button variant="primary" icon={Plus} type="button">
              Nueva mascota
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">Buscar (nombre o código)</label>
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                value={pets.query}
                onChange={(e) => pets.setQuery(e.target.value)}
                placeholder="Ej: Luna / PT-000012"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            {clientNames.loading && (
              <div className="text-xs text-[color:var(--muted)]">Cargando nombres de clientes…</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Chip>
              {pets.meta.total === 0 ? "0 resultados" : `Mostrando ${pets.meta.from}–${pets.meta.to} de ${pets.meta.total}`}
            </Chip>

            <Button
              variant="secondaryOutline"
              icon={ChevronLeft}
              type="button"
              onClick={() => pets.setPage(pets.page - 1)}
              disabled={!canPrev}
            >
              Anterior
            </Button>

            <Button
              variant="secondaryOutline"
              icon={ChevronRight}
              type="button"
              onClick={() => pets.setPage(pets.page + 1)}
              disabled={!canNext}
            >
              Siguiente
            </Button>
          </div>
        </div>

        {pets.error && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{pets.error}</span>
          </div>
        )}
      </Card>

      {/* Contenido */}
      {pets.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : pets.items.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">No hay mascotas con el filtro actual.</div>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pets.items.map((p: any) => {
            const src = getImgSrc(p);
            const speciesTxt = petSpeciesLabel(p.species);
            const nameWithSpecies = speciesTxt ? `${p.name} (${speciesTxt})` : p.name;

            return (
              <Card key={p.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{nameWithSpecies}</div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" /> {p.code}
                        </span>
                      </Chip>

                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {clientDisplay(p)}
                        </span>
                      </Chip>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
                    <PawPrint className="h-5 w-5" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white/50">
                  {src ? (
                    <img src={src} alt={p.name} className="h-44 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-sm text-[color:var(--muted)]">Sin foto</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/pets/${p.id}`}>
                    <Button variant="secondaryOutline" icon={Eye} type="button">
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/pets/${p.id}/edit`}>
                    <Button variant="primaryOutline" icon={Pencil} type="button">
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
          {pets.items.map((p: any) => {
            const src = getImgSrc(p);
            const speciesTxt = petSpeciesLabel(p.species);
            const nameWithSpecies = speciesTxt ? `${p.name} (${speciesTxt})` : p.name;

            return (
              <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/50">
                    {src ? (
                      <img src={src} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--muted)]">—</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{nameWithSpecies}</div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" /> {p.code}
                        </span>
                      </Chip>

                      <Chip>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" /> {clientDisplay(p)}
                        </span>
                      </Chip>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Link href={`/pets/${p.id}`}>
                    <Button variant="secondaryOutline" icon={Eye} type="button">
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/pets/${p.id}/edit`}>
                    <Button variant="primaryOutline" icon={Pencil} type="button">
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
