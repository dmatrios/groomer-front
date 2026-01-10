"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  CalendarDays,
  Receipt,
  BadgeDollarSign,
  UserPlus,
  PawPrint,
  CalendarPlus,
  Search,
  Settings,
  ClipboardPlus,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { ActionCard } from "@/shared/ui/components/ActionCard";
import { Badge } from "@/shared/ui/components/Badge";
import { Button } from "@/shared/ui/components/Button";

import { ApiError } from "@/shared/http/apiError";

import {
  appointmentsApi,
  type AppointmentResponse,
} from "@/features/appointments/api/appointmentsApi";
import { visitsApi, type VisitDetailResponse } from "@/features/visits/api/visitsApi";
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";
import { clientsApi, type ClientResponse } from "@/features/clients/api/clientsApi";

import { toIsoLocal } from "@/features/visits/utils/dates";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";

/* =========================
   HELPERS
   ========================= */

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function money(value: number | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `S/ ${n.toFixed(2)}`;
}

function timeHHmm(iso: string) {
  if (!iso) return "—";
  return iso.slice(11, 16);
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[color:var(--muted)]">{label}</div>
          <div className="mt-1 text-lg font-semibold">{value}</div>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-white/40 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function appointmentStatusBadge(status: AppointmentResponse["status"]) {
  // Ajusta labels si quieres (ya están en español)
  if (status === "ATTENDED") return <Badge variant="attended">Atendida</Badge>;
  if (status === "CANCELED") return <Badge variant="cancelled">Cancelada</Badge>;
  return <Badge variant="pending">Pendiente</Badge>;
}

/* =========================
   DASHBOARD
   ========================= */

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [visitsToday, setVisitsToday] = useState<VisitDetailResponse[]>([]);

  // cache para hidratar nombres (pet + client)
  const [petById, setPetById] = useState<Record<number, PetResponse>>({});
  const [clientById, setClientById] = useState<Record<number, ClientResponse>>({});

  const todayLabel = useMemo(() => formatDateLong(new Date()), []);

  async function hydratePetsAndClients(petIds: number[]) {
    const uniquePetIds = Array.from(new Set(petIds)).filter((id) => id > 0);

    // solo los que faltan
    const toFetchPets = uniquePetIds.filter((id) => !petById[id]);
    if (toFetchPets.length === 0) return;

    const pets = await Promise.all(
      toFetchPets.map(async (pid) => {
        const res = await petsApi.getById(pid);
        return res.data;
      })
    );

    const nextPetById: Record<number, PetResponse> = {};
    const clientIds: number[] = [];

    for (const p of pets) {
      if (!p) continue;
      nextPetById[p.id] = p;
      if (p.clientId) clientIds.push(p.clientId);
    }

    setPetById((prev) => ({ ...prev, ...nextPetById }));

    const uniqueClientIds = Array.from(new Set(clientIds)).filter((id) => id > 0);
    const toFetchClients = uniqueClientIds.filter((id) => !clientById[id]);
    if (toFetchClients.length === 0) return;

    const clients = await Promise.all(
      toFetchClients.map(async (cid) => {
        const res = await clientsApi.getById(cid);
        return res.data;
      })
    );

    const nextClientById: Record<number, ClientResponse> = {};
    for (const c of clients) {
      if (!c) continue;
      nextClientById[c.id] = c;
    }

    setClientById((prev) => ({ ...prev, ...nextClientById }));
  }

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getTodayRange();

      // Citas de hoy
      const aRes = await appointmentsApi.list({ from: start, to: end });
      const a = aRes.data ?? [];
      setAppointments(a);

      // Atenciones de hoy
      const vRes = await visitsApi.listByRange(toIsoLocal(start), toIsoLocal(end));
      const v = vRes.data ?? [];
      setVisitsToday(v);

      // hidratar nombres
      const petIds = [...a.map((x) => x.petId), ...v.map((x) => x.petId)];
      await hydratePetsAndClients(petIds);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "No se pudo cargar el dashboard";
      setError(msg);
      setAppointments([]);
      setVisitsToday([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingPayments = useMemo(
    () => visitsToday.filter((v) => v.payment?.status === "PENDING" || v.payment?.status === "PARTIAL"),
    [visitsToday]
  );

  const stats = useMemo(() => {
    return {
      citasHoy: appointments.length,
      atencionesHoy: visitsToday.length,
      pagosPendientes: pendingPayments.length,
    };
  }, [appointments.length, visitsToday.length, pendingPayments.length]);

  return (
    <div className="space-y-6">
      {/* HERO / HEADER premium */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                <Sparkles className="h-5 w-5 text-[color:var(--primary)]" />
              </span>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                  Jornada
                </div>
                <h2 className="text-2xl font-semibold leading-tight">Hoy</h2>
                <p className="text-sm text-[color:var(--muted)] capitalize">{todayLabel}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/visits/new">
                <Button variant="primary" icon={ClipboardPlus} type="button">
                  Registrar atención
                </Button>
              </Link>

              <Button variant="secondaryOutline" type="button" onClick={load} disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Citas hoy" value={stats.citasHoy} icon={CalendarDays} />
            <StatCard label="Atenciones hoy" value={stats.atencionesHoy} icon={Receipt} />
            <StatCard label="Pagos pendientes" value={stats.pagosPendientes} icon={BadgeDollarSign} />
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-medium">Tip:</span>{" "}
            <span className="text-[color:var(--muted)]">
              Si atendiste una cita, entra al detalle y registra la atención para que quede en el historial.
            </span>
          </div>
        </div>
      </Card>

      {/* Acciones rápidas */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--muted)]">Acciones rápidas</h3>
          <p className="text-xs text-[color:var(--muted)]">Entrar directo a lo más usado.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Registrar atención"
            description="Ingreso directo a atenciones"
            icon={ClipboardPlus}
            href="/visits/new"
            accent="green"
          />
          <ActionCard title="Nuevo cliente" description="Registrar una persona" icon={UserPlus} href="/clients/new" accent="cyan" />
          <ActionCard title="Nueva mascota" description="Agregar mascota a un cliente" icon={PawPrint} href="/pets/new" accent="indigo" />
          <ActionCard title="Nueva cita" description="Agendar una cita" icon={CalendarPlus} href="/appointments/new" accent="orange" />
          <ActionCard title="Buscar" description="Cliente, mascota o teléfono" icon={Search} href="/search" />
          <ActionCard title="Catálogos" description="Zonas, tratamientos, medicinas" icon={Settings} href="/catalogs" accent="orange" />
        </div>
      </section>

      {/* Estado / error */}
      {error ? (
        <Card className="p-6 text-sm">
          <div className="font-semibold">Error cargando dashboard</div>
          <div className="text-[color:var(--muted)]">{error}</div>
          <div className="mt-3">
            <Button variant="secondaryOutline" type="button" onClick={load}>
              Reintentar
            </Button>
          </div>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Citas de hoy */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Citas de hoy</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {loading ? "Cargando…" : `${appointments.length} registros`}
                </div>
              </div>

              <Link href="/appointments?today=true">
                <Button variant="secondaryOutline" type="button">
                  Ver todo
                </Button>
              </Link>
            </div>

            {/* Desktop: alto fijo + scroll */}
            <div className="hidden sm:block">
              <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
                {appointments.map((a) => {
                  const pet = petById[a.petId];
                  const client = pet?.clientId ? clientById[pet.clientId] : undefined;

                  const petLabel = pet?.name ? pet.name : `Mascota #${a.petId}`;
                  const ownerLabel = client
                    ? `${client.firstName} ${client.lastName}`.trim()
                    : "Cliente";

                  return (
                    <Link key={a.id} href={`/appointments/${a.id}`} className="block">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 transition-all hover:shadow-sm">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex w-[66px] justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-xs font-semibold text-[color:var(--muted)]">
                              {timeHHmm(a.startAt)}
                            </span>

                            <div className="truncate font-semibold">
                              {petLabel}
                              <span className="text-[color:var(--muted)]"> — {ownerLabel}</span>
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-[color:var(--muted)]">
                            Cita #{a.id} · {a.notes ? "Con notas" : "Sin notas"}
                          </div>
                        </div>

                        {appointmentStatusBadge(a.status)}
                      </div>
                    </Link>
                  );
                })}

                {!loading && appointments.length === 0 && (
                  <div className="text-sm text-[color:var(--muted)]">No hay citas para hoy.</div>
                )}
              </div>
            </div>

            {/* Mobile: carrusel */}
            <div className="sm:hidden">
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
                {appointments.map((a) => {
                  const pet = petById[a.petId];
                  const client = pet?.clientId ? clientById[pet.clientId] : undefined;

                  const petLabel = pet?.name ? pet.name : `Mascota #${a.petId}`;
                  const ownerLabel = client
                    ? `${client.firstName} ${client.lastName}`.trim()
                    : "Cliente";

                  return (
                    <Link key={a.id} href={`/appointments/${a.id}`} className="snap-start">
                      <div className="w-[290px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition-all hover:shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Chip>{timeHHmm(a.startAt)}</Chip>
                          {appointmentStatusBadge(a.status)}
                        </div>
                        <div className="mt-2 text-sm font-semibold">{petLabel}</div>
                        <div className="text-xs text-[color:var(--muted)]">{ownerLabel}</div>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">Cita #{a.id}</div>
                      </div>
                    </Link>
                  );
                })}

                {!loading && appointments.length === 0 && (
                  <div className="text-sm text-[color:var(--muted)]">No hay citas para hoy.</div>
                )}
              </div>
            </div>
          </Card>

          {/* Pagos pendientes */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Pagos pendientes</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {loading ? "Cargando…" : `${pendingPayments.length} pendientes`}
                </div>
              </div>

              <Link href="/visits">
                <Button variant="secondaryOutline" type="button">
                  Ver atenciones
                </Button>
              </Link>
            </div>

            {/* Desktop: alto fijo + scroll */}
            <div className="hidden sm:block">
              <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
                {pendingPayments.map((v) => {
                  const pet = petById[v.petId];
                  const client = pet?.clientId ? clientById[pet.clientId] : undefined;

                  const petLabel = pet?.name ? pet.name : `Mascota #${v.petId}`;
                  const ownerLabel = client
                    ? `${client.firstName} ${client.lastName}`.trim()
                    : "Cliente";

                  const st = v.payment?.status ?? "PENDING";
                  const ui = paymentStatusUI[st];

                  return (
                    <Link key={v.id} href={`/visits/${v.id}`} className="block">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 transition-all hover:shadow-sm">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {ownerLabel}
                            <span className="text-[color:var(--muted)]"> — {petLabel}</span>
                          </div>
                          <div className="mt-1 text-xs text-[color:var(--muted)]">
                            Atención #{v.id} · Total {money(v.totalAmount)}
                          </div>
                        </div>

                        <Badge variant={ui.variant}>{ui.label}</Badge>
                      </div>
                    </Link>
                  );
                })}

                {!loading && pendingPayments.length === 0 && (
                  <div className="text-sm text-[color:var(--muted)]">
                    Todo ok: no hay pagos pendientes hoy.
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: carrusel */}
            <div className="sm:hidden">
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
                {pendingPayments.map((v) => {
                  const pet = petById[v.petId];
                  const client = pet?.clientId ? clientById[pet.clientId] : undefined;

                  const petLabel = pet?.name ? pet.name : `Mascota #${v.petId}`;
                  const ownerLabel = client
                    ? `${client.firstName} ${client.lastName}`.trim()
                    : "Cliente";

                  const st = v.payment?.status ?? "PENDING";
                  const ui = paymentStatusUI[st];

                  return (
                    <Link key={v.id} href={`/visits/${v.id}`} className="snap-start">
                      <div className="w-[290px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition-all hover:shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Chip>Atención #{v.id}</Chip>
                          <Badge variant={ui.variant}>{ui.label}</Badge>
                        </div>
                        <div className="mt-2 text-sm font-semibold">{ownerLabel}</div>
                        <div className="text-xs text-[color:var(--muted)]">{petLabel}</div>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">
                          Total: {money(v.totalAmount)}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {!loading && pendingPayments.length === 0 && (
                  <div className="text-sm text-[color:var(--muted)]">
                    Todo ok: no hay pagos pendientes hoy.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
