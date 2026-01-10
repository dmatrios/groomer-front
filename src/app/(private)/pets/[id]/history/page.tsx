"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Pencil,
  PawPrint,
  Filter,
  BadgeDollarSign,
  Receipt,
  CalendarDays,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";

import { usePetHistory } from "@/features/pets/hooks/usePetHistory";
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";
import type {
  VisitDetailResponse,
  VisitItemCategory,
} from "@/features/visits/api/visitsApi";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";
import { visitItemCategoryUI } from "@/features/visits/ui/visitItemCategoryUI";

/** ========= UI helpers ========= */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function formatDateLabel(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function money(value: number | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `S/ ${n.toFixed(2)}`;
}

type FilterKey = "ALL" | VisitItemCategory;

const FILTERS = [
  { key: "ALL", label: "Todas" },
  { key: "OTHER", label: "General" },
  { key: "BATH", label: "Baños" },
  { key: "TREATMENT", label: "Tratamientos" },
  { key: "HAIRCUT", label: "Cortes" },
] as const satisfies ReadonlyArray<{ key: FilterKey; label: string }>;

const CAT_ORDER = ["OTHER", "BATH", "TREATMENT", "HAIRCUT"] as const;

function hasCategory(v: VisitDetailResponse, cat: VisitItemCategory) {
  return v.items?.some((it) => it.category === cat);
}

/** ========= PAGE ========= */

export default function PetHistoryPage() {
  const params = useParams<{ id: string }>();
  const petId = useMemo(() => Number(params.id), [params.id]);

  // UI: filtro
  const [filter, setFilter] = useState<FilterKey>("ALL");

  // Data: historial
  const history = usePetHistory({
    petId,
    category: filter,
  });

  // UX: mostrar nombre mascota arriba
  const [pet, setPet] = useState<PetResponse | null>(null);
  const [petLoading, setPetLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function loadPet() {
      if (!Number.isFinite(petId) || petId <= 0) {
        if (mounted) {
          setPet(null);
          setPetLoading(false);
        }
        return;
      }

      setPetLoading(true);
      try {
        const res = await petsApi.getById(petId);
        if (!mounted) return;
        setPet(res.data ?? null);
      } catch {
        if (!mounted) return;
        setPet(null);
      } finally {
        if (!mounted) return;
        setPetLoading(false);
      }
    }

    loadPet();

    return () => {
      mounted = false;
    };
  }, [petId]);

  // Agrupar por día (YYYY-MM-DD)
  const grouped = useMemo(() => {
    const map = new Map<string, VisitDetailResponse[]>();

    for (const v of history.items) {
      const day = (v.visitedAt ?? "").slice(0, 10) || "—";
      const arr = map.get(day) ?? [];
      arr.push(v);
      map.set(day, arr);
    }

    const keys = Array.from(map.keys()).sort().reverse(); // más reciente arriba

    return keys.map((k) => ({
      key: k,
      title: k === "—" ? "Sin fecha" : k,
      items: (map.get(k) ?? [])
        .slice()
        .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)),
    }));
  }, [history.items]);

  const petTitle = petLoading
    ? `Mascota #${petId}`
    : pet?.name
    ? pet.name
    : `Mascota #${petId}`;

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Historial de atenciones</h2>
            <p className="text-sm text-[color:var(--muted)]">
              {petTitle} · filtra por tipo (general/baños/tratamientos/cortes).
              Incluye pago e items.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/pets/${petId}`}>
              <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
                Volver
              </Button>
            </Link>

            <Button
              variant="secondaryOutline"
              icon={RefreshCw}
              type="button"
              onClick={history.refresh}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <PawPrint className="h-4 w-4 mr-1" />
              {petTitle}
            </Chip>

            <Chip>
              <Receipt className="h-4 w-4 mr-1" />
              {history.items.length === 0
                ? "0 atenciones"
                : `${history.items.length} atención(es)`}
            </Chip>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Chip>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "primaryOutline" : "ghost"}
                  type="button"
                  className="px-3"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ERROR */}
      {history.error && (
        <Card className="p-6 text-sm">
          <div className="font-semibold">Error</div>
          <div className="text-[color:var(--muted)]">{history.error}</div>
          <div className="mt-3">
            <Button
              variant="secondaryOutline"
              type="button"
              onClick={history.refresh}
            >
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      {/* LOADING / EMPTY / CONTENT */}
      {history.loading ? (
        <div className="text-sm text-[color:var(--muted)]">
          Cargando historial…
        </div>
      ) : history.items.length === 0 ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">
            No hay atenciones para esta mascota
            {filter !== "ALL" ? " con este filtro." : "."}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => {
            const title =
              g.key === "—"
                ? "Sin fecha"
                : `${formatDateLabel(g.key)} · ${g.key}`;

            return (
              <Card key={g.key} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[color:var(--muted)]" />
                    <div className="text-sm font-semibold">{title}</div>
                  </div>
                  <Chip>{g.items.length} atención(es)</Chip>
                </div>

                <div className="space-y-2">
                  {g.items.map((v) => {
                    const pay = v.payment?.status
                      ? paymentStatusUI[v.payment.status]
                      : null;

                    // badges de categorías (rápido para el usuario)
                    const catBadges = CAT_ORDER.filter((c) =>
                      hasCategory(v, c)
                    );

                    return (
                      <div
                        key={v.id}
                        className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold">
                              {formatTime(v.visitedAt)}
                            </div>

                            <Chip># {v.id}</Chip>

                            {pay && (
                              <Badge variant={pay.variant}>{pay.label}</Badge>
                            )}

                            {/* mini resumen por tipo */}
                            {catBadges.map((c) => {
                              const ui = visitItemCategoryUI?.[c];
                              return (
                                <Chip key={c}>{ui?.label ?? c}</Chip>
                              );
                            })}

                            <Chip>
                              <BadgeDollarSign className="h-4 w-4 mr-1" />
                              {money(v.totalAmount)}
                            </Chip>

                            {v.appointmentId != null && (
                              <Chip>Cita #{v.appointmentId}</Chip>
                            )}
                          </div>

                          {v.notes?.trim() && (
                            <div className="mt-1 text-xs text-[color:var(--muted)]">
                              {v.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <Link href={`/visits/${v.id}`}>
                            <Button
                              variant="secondaryOutline"
                              icon={Eye}
                              type="button"
                            >
                              Ver
                            </Button>
                          </Link>

                          <Link
                            href={`/visits/${v.id}/edit?from=${encodeURIComponent(
                              `/pets/${petId}/history`
                            )}`}
                          >
                            <Button
                              variant="primaryOutline"
                              icon={Pencil}
                              type="button"
                            >
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
