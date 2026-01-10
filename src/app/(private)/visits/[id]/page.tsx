"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  PawPrint,
  Receipt,
  BadgeDollarSign,
  Dog,
  User,
  CalendarDays,
  Hash,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Badge } from "@/shared/ui/components/Badge";
import { assetUrl } from "@/shared/config/asset"; // ✅ FIX

import { visitsApi, type VisitDetailResponse } from "@/features/visits/api/visitsApi";
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";
import { clientsApi, type ClientResponse } from "@/features/clients/api/clientsApi";

import { ApiError } from "@/shared/http/apiError";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";
import { visitItemCategoryUI } from "@/features/visits/ui/visitItemCategoryUI";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function money(value: number | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `S/ ${n.toFixed(2)}`;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
      <div className="rounded-xl border border-[color:var(--border)] bg-white/40 p-2">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[color:var(--muted)]">{label}</div>
        <div className="truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default function VisitDetailPage() {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params.id), [params.id]);

  const [data, setData] = useState<VisitDetailResponse | null>(null);
  const [pet, setPet] = useState<PetResponse | null>(null);
  const [client, setClient] = useState<ClientResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await visitsApi.getById(id);
      setData(res.data ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando atención"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function hydratePetAndClient(visit: VisitDetailResponse) {
    setHydrating(true);
    try {
      const pRes = await petsApi.getById(visit.petId);
      const p = pRes.data ?? null;
      setPet(p);

      if (p?.clientId != null) {
        const cRes = await clientsApi.getById(p.clientId);
        setClient(cRes.data ?? null);
      } else {
        setClient(null);
      }
    } catch {
      setPet(null);
      setClient(null);
    } finally {
      setHydrating(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!data) return;
    hydratePetAndClient(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const visitedAtText = data?.visitedAt ? formatDateTime(data.visitedAt) : "—";

  const paymentBadge = useMemo(() => {
    if (!data?.payment?.status) return null;
    const ui = paymentStatusUI[data.payment.status];
    return <Badge variant={ui.variant}>{ui.label}</Badge>;
  }, [data?.payment?.status]);

  const mainTitle = data ? `Atención #${data.id}` : "Detalle de atención";

  // ✅ FIX: siempre construir URL de asset correctamente
  const petPhotoSrc = useMemo(() => {
    return assetUrl(pet?.mainPhotoUrl ?? null);
  }, [pet?.mainPhotoUrl]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{mainTitle}</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Visualiza mascota, cliente, items, total y estado de pago. {hydrating ? " (Hidratando datos…)" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/visits">
              <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
                Volver
              </Button>
            </Link>

            {data && (
              <Link href={`/visits/${data.id}/edit?from=${encodeURIComponent(`/visits/${data.id}`)}`}>
                <Button variant="primaryOutline" icon={Pencil} type="button">
                  Editar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Hash} label="ID" value={Number.isFinite(id) ? id : "—"} />
          <Stat icon={CalendarDays} label="Fecha" value={visitedAtText} />
          <Stat icon={Receipt} label="Total" value={data ? money(data.totalAmount) : "—"} />
          <Stat
            icon={data?.payment ? BadgeCheck : AlertCircle}
            label="Pago"
            value={data?.payment ? paymentBadge ?? "—" : "Sin pago"}
          />
        </div>

        {data?.notes?.trim() && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4" />
              <div className="font-semibold">Notas</div>
            </div>
            <div className="mt-2 text-[color:var(--muted)]">{data.notes}</div>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : error ? (
        <Card className="p-6 text-sm">
          <div className="font-semibold">Error</div>
          <div className="text-[color:var(--muted)]">{error}</div>
          <div className="mt-3">
            <Button variant="secondaryOutline" type="button" onClick={load}>
              Reintentar
            </Button>
          </div>
        </Card>
      ) : !data ? (
        <Card className="p-6 text-sm text-[color:var(--muted)]">Sin data.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
          {/* LEFT: Mascota / Cliente */}
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Dog className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Mascota</div>
                    <div className="text-xs text-[color:var(--muted)]">Datos principales</div>
                  </div>
                </div>
                <Chip>Mascota #{data.petId}</Chip>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                <div className="aspect-[16/9] w-full bg-white/40">
                  {petPhotoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={petPhotoSrc}
                      alt={pet?.name ?? "Mascota"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[color:var(--muted)]">
                      Sin foto principal
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-sm font-semibold">{pet?.name ?? "—"}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    Código: <span className="font-semibold">{pet?.code ?? "—"}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/pets/${data.petId}`}>
                      <Button variant="secondaryOutline" type="button">
                        Ver mascota
                      </Button>
                    </Link>
                    <Link href={`/pets/${data.petId}/edit`}>
                      <Button variant="primaryOutline" icon={Pencil} type="button">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Cliente</div>
                    <div className="text-xs text-[color:var(--muted)]">Dueño de la mascota</div>
                  </div>
                </div>
                {client?.id ? <Chip>Cliente #{client.id}</Chip> : <Chip>—</Chip>}
              </div>

              {client ? (
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
                  <div>
                    <span className="font-semibold">Nombre:</span>{" "}
                    <span className="text-[color:var(--muted)]">
                      {client.firstName} {client.lastName}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="font-semibold">Código:</span>{" "}
                    <span className="text-[color:var(--muted)]">{client.code}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="secondaryOutline" type="button">
                        Ver cliente
                      </Button>
                    </Link>
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="primaryOutline" icon={Pencil} type="button">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[color:var(--muted)]">No disponible (aún).</div>
              )}

              {data.appointmentId != null && (
                <div className="text-xs text-[color:var(--muted)]">
                  Vinculada a cita #{data.appointmentId} (cuando hagamos el detalle de citas, lo linkeamos).
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT: Pago + Items */}
          <div className="space-y-4">
            {/* Pago */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Pago</div>
                    <div className="text-xs text-[color:var(--muted)]">Estado, método y saldo</div>
                  </div>
                </div>

                {paymentBadge ?? <Chip>Sin pago</Chip>}
              </div>

              {data.payment ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">Método</div>
                    <div className="mt-1 text-sm font-semibold">{data.payment.method ?? "(sin método)"}</div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">Monto pagado</div>
                    <div className="mt-1 text-sm font-semibold">{money(data.payment.amountPaid)}</div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">Saldo</div>
                    <div className="mt-1 text-sm font-semibold">{money(data.payment.balance)}</div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">Total</div>
                    <div className="mt-1 text-sm font-semibold">{money(data.totalAmount)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[color:var(--muted)]">Sin pago registrado.</div>
              )}
            </Card>

            {/* Items */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Items</div>
                    <div className="text-xs text-[color:var(--muted)]">Servicios / tratamientos realizados</div>
                  </div>
                </div>
                <Chip>{data.items.length}</Chip>
              </div>

              <div className="space-y-3">
                {data.items.map((it) => {
                  const catLabel = visitItemCategoryUI?.[it.category]?.label ?? it.category;
                  const isTreatment = Boolean(it.treatmentDetail);

                  return (
                    <div
                      key={it.id}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip>Item #{it.id}</Chip>
                            <Chip>{catLabel}</Chip>
                            {isTreatment && <Chip>Tratamiento</Chip>}
                          </div>

                          {it.detail?.trim() && (
                            <div className="text-sm text-[color:var(--muted)]">
                              <span className="font-semibold">Detalle:</span> {it.detail}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold text-[color:var(--muted)]">Precio</div>
                          <div className="text-lg font-semibold">{money(it.price)}</div>
                        </div>
                      </div>

                      {it.treatmentDetail && (
                        <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-white/40 p-3 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <Chip>
                              Tipo:{" "}
                              <span className="ml-1 font-semibold">
                                {it.treatmentDetail.treatmentTypeText ??
                                  (it.treatmentDetail.treatmentTypeId != null
                                    ? `#${it.treatmentDetail.treatmentTypeId}`
                                    : "—")}
                              </span>
                            </Chip>
                            <Chip>
                              Medicamento:{" "}
                              <span className="ml-1 font-semibold">
                                {it.treatmentDetail.medicineText ??
                                  (it.treatmentDetail.medicineId != null ? `#${it.treatmentDetail.medicineId}` : "—")}
                              </span>
                            </Chip>
                            {it.treatmentDetail.nextDate && <Chip>Próxima: {it.treatmentDetail.nextDate}</Chip>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Acciones rápidas */}
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Acciones</div>
                  <div className="text-xs text-[color:var(--muted)]">Atajos útiles</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/visits/${data.id}/edit?from=${encodeURIComponent(`/visits/${data.id}`)}`}>
                  <Button variant="primary" icon={Pencil} type="button">
                    Editar atención
                  </Button>
                </Link>
                <Link href="/visits">
                  <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
                    Volver a lista
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
