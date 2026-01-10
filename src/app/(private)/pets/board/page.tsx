"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  X,
  PawPrint,
  User,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { assetUrl } from "@/shared/config/asset";

import { usePetsList } from "@/features/pets/hooks/usePetsList";
import { usePetThumbs } from "@/features/pets/hooks/usePetThumbs";

import { clientsApi, type ClientResponse } from "@/features/clients/api/clientsApi";

/* =========================
   UI helpers
========================= */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

/* =========================
   Species UI
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
   Client name map (cache)
========================= */

function shortClientName(c: ClientResponse) {
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  const lastInitial = last ? `${last[0].toUpperCase()}.` : "";
  return `${first}${lastInitial ? ` ${lastInitial}` : ""}`.trim();
}

function useClientNameMap(clientIds: number[]) {
  const [map, setMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const idsKey = useMemo(() => clientIds.slice().sort((a, b) => a - b).join(","), [clientIds]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  function getLabel(clientId?: number | null) {
    if (!clientId) return null;
    return map[clientId] ?? null;
  }

  return { getLabel, loading };
}

/* =========================
   Skeleton card (loading)
========================= */

function SkeletonCard() {
  return (
    <Card className="p-3">
      <div className="h-24 w-full animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-[color:var(--surface)]" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-[color:var(--surface)]" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-9 animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
        <div className="h-9 animate-pulse rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
      </div>
    </Card>
  );
}

export default function PetsBoardPage() {
  const pets = usePetsList();

  // ✅ Vista densa: 30 por página (5x6 en desktop)
  useEffect(() => {
    pets.setPageSize(30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = pets.page > 0;
  const canNext = pets.page + 1 < pets.meta.totalPages;

  // ✅ Pre-carga de miniaturas
  const petIds = useMemo(() => pets.items.map((p: any) => Number(p.id)), [pets.items]);
  const thumbs = usePetThumbs(petIds);

  function getImgSrc(p: { id: number; mainPhotoUrl?: string | null }) {
    const url = p.mainPhotoUrl ?? thumbs.getThumb(Number(p.id));
    return assetUrl(url);
  }

  // 🔎 Buscador local con debounce
  const [q, setQ] = useState(pets.query);

  useEffect(() => {
    setQ(pets.query);
  }, [pets.query]);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = q.trim();
      pets.setQuery(trimmed);
      pets.setPage(0);
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ✅ Hidratar nombres de clientes (por la página actual)
  const clientIds = useMemo(() => {
    const set = new Set<number>();
    for (const p of pets.items as any[]) {
      const id = Number(p.clientId);
      if (Number.isFinite(id)) set.add(id);
    }
    return Array.from(set);
  }, [pets.items]);

  const clientNames = useClientNameMap(clientIds);

  function clientDisplay(p: any) {
    const id = Number(p.clientId);
    const label = clientNames.getLabel(id);
    return label ? label : `Cliente #${id}`;
  }

  const totalLabel =
    pets.meta.total === 0 ? "0 resultados" : `Mostrando ${pets.meta.from}–${pets.meta.to} de ${pets.meta.total}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Mascotas — Vista densa</h2>
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            Operación rápida con muchas tarjetas por pantalla.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Chip>{totalLabel}</Chip>
            {clientNames.loading && <Chip>Clientes: cargando…</Chip>}
            {!!q.trim() && <Chip>Filtro: “{q.trim()}”</Chip>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/pets">
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>

          <Button variant="secondaryOutline" icon={RefreshCw} type="button" onClick={pets.refresh}>
            Actualizar
          </Button>

          <div className="flex items-center gap-2">
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
      </Card>

      {/* Filtros */}
      <Card className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">Buscar (nombre o código)</label>

            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: Luna / PT-000012"
                className="w-full bg-transparent text-sm outline-none"
              />

              {!!q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-lg p-1 transition-all duration-200 hover:shadow-sm"
                  aria-label="Limpiar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-[color:var(--muted)]">Tip: escribe y filtra al instante (debounce 250ms).</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              variant="secondaryOutline"
              type="button"
              onClick={() => {
                setQ("");
                pets.setQuery("");
                pets.setPage(0);
              }}
              disabled={!q.trim()}
            >
              Limpiar filtro
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : pets.items.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">No hay mascotas.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {(pets.items as any[]).map((p) => {
            const src = getImgSrc(p);
            const speciesTxt = petSpeciesLabel(p.species);
            const nameWithSpecies = speciesTxt ? `${p.name} (${speciesTxt})` : p.name;

            return (
              <Card key={p.id} className="p-3">
                <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/50">
                  {src ? (
                    <img src={src} alt={p.name} className="h-24 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-[color:var(--muted)]">
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="mt-2 truncate text-sm font-semibold">{nameWithSpecies}</div>

                <div className="mt-1 space-y-1">
                  <div className="truncate text-xs text-[color:var(--muted)]">{p.code}</div>

                  <div className="truncate text-xs text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {clientDisplay(p)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={`/pets/${p.id}`} className="w-full">
                    <Button variant="secondaryOutline" icon={Eye} type="button" className="w-full justify-center">
                      Ver
                    </Button>
                  </Link>

                  <Link href={`/pets/${p.id}/edit`} className="w-full">
                    <Button variant="primaryOutline" icon={Pencil} type="button" className="w-full justify-center">
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
