"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X, Users, Dog, CalendarDays, Receipt, RefreshCw } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";

import { useGlobalSearch } from "@/features/search/hooks/useGlobalSearch";

type Tab = "all" | "clients" | "pets" | "appointments" | "visits";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function money(v: string | number | null | undefined) {
  if (v == null) return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `S/ ${n.toFixed(2)}`;
}

export default function SearchPage() {
  const s = useGlobalSearch();
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    const d = s.data;
    const clients = d?.clients?.length ?? 0;
    const pets = d?.pets?.length ?? 0;
    const appointments = d?.appointments?.length ?? 0;
    const visits = d?.visits?.length ?? 0;
    return { clients, pets, appointments, visits, total: clients + pets + appointments + visits };
  }, [s.data]);

  // ✅ map petId -> name (para mostrar nombre en citas/atenciones)
  const petNameById = useMemo(() => {
    const map = new Map<number, string>();
    const pets = s.data?.pets ?? [];
    for (const p of pets) map.set(Number(p.id), p.name);
    return map;
  }, [s.data?.pets]);

  function petLabel(petId: number) {
    return petNameById.get(Number(petId)) ?? `Mascota #${petId}`;
  }

  function clear() {
    s.setQ("");
    s.run("");
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Búsqueda</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Busca en todo el sistema (cliente / mascota / cita / atención).
            </p>
          </div>

          <Button
            variant="secondaryOutline"
            icon={RefreshCw}
            type="button"
            onClick={s.refresh}
            disabled={s.loading}
          >
            Actualizar
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
            <Search className="h-4 w-4 text-[color:var(--muted)]" />
            <input
              value={s.q}
              onChange={(e) => {
                s.setQ(e.target.value);
                s.runDebounced(e.target.value);
              }}
              placeholder="Ej: Luna, PT-0001, CL-0003, 999888777..."
              className="w-full bg-transparent text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") s.run(s.q);
              }}
            />
            {s.q.trim() && (
              <button
                type="button"
                onClick={clear}
                className="rounded-lg p-1 transition-all duration-200 hover:shadow-sm"
                aria-label="Limpiar"
                title="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="primary"
            type="button"
            onClick={() => s.run(s.q)}
            disabled={!s.q.trim() || s.loading}
          >
            Buscar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip>Resultados: {counts.total}</Chip>
          {s.data?.query ? <Chip>Query: “{s.data.query}”</Chip> : <Chip>—</Chip>}
        </div>

        {s.error && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{s.error}</span>
          </div>
        )}
      </Card>

      <Card className="flex flex-wrap items-center gap-2">
        <Button variant={tab === "all" ? "primaryOutline" : "ghost"} type="button" onClick={() => setTab("all")}>
          Todo
        </Button>
        <Button variant={tab === "clients" ? "primaryOutline" : "ghost"} icon={Users} type="button" onClick={() => setTab("clients")}>
          Clientes ({counts.clients})
        </Button>
        <Button variant={tab === "pets" ? "primaryOutline" : "ghost"} icon={Dog} type="button" onClick={() => setTab("pets")}>
          Mascotas ({counts.pets})
        </Button>
        <Button variant={tab === "appointments" ? "primaryOutline" : "ghost"} icon={CalendarDays} type="button" onClick={() => setTab("appointments")}>
          Citas ({counts.appointments})
        </Button>
        <Button variant={tab === "visits" ? "primaryOutline" : "ghost"} icon={Receipt} type="button" onClick={() => setTab("visits")}>
          Atenciones ({counts.visits})
        </Button>
      </Card>

      {s.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Buscando…</div>
      ) : !s.data ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">Escribe algo para buscar.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {(tab === "all" || tab === "clients") && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Clientes</div>
                    <div className="text-xs text-[color:var(--muted)]">Coincidencias</div>
                  </div>
                </div>
                <Chip>{counts.clients}</Chip>
              </div>

              {s.data.clients.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Sin resultados.</div>
              ) : (
                <div className="space-y-2">
                  {s.data.clients.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {/* ✅ ahora viene fullName */}
                          {c.fullName?.trim() ? c.fullName : `Cliente #${c.id}`}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Chip>Código: {c.code}</Chip>
                          <Chip>ID: {c.id}</Chip>
                          {c.zoneText ? <Chip>Zona: {c.zoneText}</Chip> : null}
                        </div>
                      </div>

                      <Link href={`/clients/${c.id}`}>
                        <Button variant="secondaryOutline" type="button">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {(tab === "all" || tab === "pets") && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Dog className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Mascotas</div>
                    <div className="text-xs text-[color:var(--muted)]">Coincidencias</div>
                  </div>
                </div>
                <Chip>{counts.pets}</Chip>
              </div>

              {s.data.pets.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Sin resultados.</div>
              ) : (
                <div className="space-y-2">
                  {s.data.pets.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Chip>Código: {p.code}</Chip>
                          <Chip>Cliente #{p.clientId}</Chip>
                        </div>
                      </div>

                      <Link href={`/pets/${p.id}`}>
                        <Button variant="secondaryOutline" type="button">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {(tab === "all" || tab === "appointments") && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Citas</div>
                    <div className="text-xs text-[color:var(--muted)]">Coincidencias</div>
                  </div>
                </div>
                <Chip>{counts.appointments}</Chip>
              </div>

              {s.data.appointments.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Sin resultados.</div>
              ) : (
                <div className="space-y-2">
                  {s.data.appointments.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">Cita #{a.id}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {/* ✅ ahora mostramos nombre de mascota si existe */}
                          <Chip>{petLabel(a.petId)}</Chip>
                          <Chip>Estado: {a.status}</Chip>
                        </div>
                      </div>

                      <Link href={`/appointments/${a.id}`}>
                        <Button variant="secondaryOutline" type="button">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {(tab === "all" || tab === "visits") && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Atenciones</div>
                    <div className="text-xs text-[color:var(--muted)]">Coincidencias</div>
                  </div>
                </div>
                <Chip>{counts.visits}</Chip>
              </div>

              {s.data.visits.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">Sin resultados.</div>
              ) : (
                <div className="space-y-2">
                  {s.data.visits.map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]
                                 px-4 py-3 transition-all duration-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">Atención #{v.id}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {/* ✅ nombre de mascota */}
                          <Chip>{petLabel(v.petId)}</Chip>
                          {v.appointmentId != null && <Chip>Cita #{v.appointmentId}</Chip>}
                          <Chip>Total: {money(v.totalAmount)}</Chip>
                        </div>
                      </div>

                      <Link href={`/visits/${v.id}`}>
                        <Button variant="secondaryOutline" type="button">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
