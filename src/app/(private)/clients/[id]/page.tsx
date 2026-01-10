"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Hash,
  MapPin,
  FileText,
  Phone,
  Plus,
  Trash2,
  PawPrint,
  Eye,
  UserPlus,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { useZonesCatalog } from "@/features/catalogs/hooks/useCatalogs";
import { useClientDetail } from "@/features/clients/hooks/useClientDetail";
import { ApiError } from "@/shared/http/apiError";
import { assetUrl } from "@/shared/config/asset";
import { usePetThumbs } from "@/features/pets/hooks/usePetThumbs";

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

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = useMemo(() => Number(params.id), [params.id]);

  const zones = useZonesCatalog();
  const detail = useClientDetail(clientId);

  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const zoneMap = useMemo(() => {
    const map = new Map<number, string>();
    zones.items.forEach((z) => map.set(z.id, z.name));
    return map;
  }, [zones.items]);

  // ✅ Pre-carga de miniaturas para mascotas del cliente
  const petIds = useMemo(() => detail.pets.map((p) => Number(p.id)), [detail.pets]);
  const thumbs = usePetThumbs(petIds);

  function getPetThumbSrc(pet: { id: number }) {
    const url = thumbs.getThumb(Number(pet.id)); // viene de GET /pets/{id} (mainPhotoUrl)
    return assetUrl(url);
  }

  if (!Number.isFinite(clientId)) {
    return (
      <Card className="space-y-2">
        <h2 className="text-xl font-semibold">ID inválido</h2>
        <p className="text-sm text-[color:var(--muted)]">
          No se pudo abrir el cliente (id incorrecto).
        </p>
        <Link href="/clients">
          <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
            Volver
          </Button>
        </Link>
      </Card>
    );
  }

  const c = detail.client;
  const zoneName = c?.zoneId != null ? zoneMap.get(c.zoneId) : undefined;

  async function onAddPhone() {
    const trimmed = phone.trim();
    if (!trimmed) return;

    setPhoneSaving(true);
    setLocalError(null);
    try {
      await detail.addPhone(trimmed);
      setPhone("");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo agregar el teléfono";
      setLocalError(msg);
    } finally {
      setPhoneSaving(false);
    }
  }

  async function onDeletePhone(phoneId: number) {
    setLocalError(null);
    try {
      await detail.deletePhone(phoneId);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo eliminar el teléfono";
      setLocalError(msg);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {c ? `${c.lastName}, ${c.firstName}` : "Cliente"}
          </h2>
          <p className="text-sm text-[color:var(--muted)]">
            Detalle del cliente, teléfonos y mascotas.
          </p>

          {c && (
            <div className="mt-2 flex flex-wrap gap-2">
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
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/clients">
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>

          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="primaryOutline" type="button">
              Editar
            </Button>
          </Link>
        </div>
      </Card>

      {(detail.error || localError) && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
          <span className="font-semibold">Error:</span>{" "}
          <span className="text-[color:var(--muted)]">
            {localError ?? detail.error}
          </span>
        </div>
      )}

      {detail.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !c ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">
            No se encontró el cliente.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Notas */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
              <FileText className="h-4 w-4" />
              Notas
            </div>
            <div className="text-sm text-[color:var(--muted)]">
              {c.notes?.trim() ? c.notes : "—"}
            </div>
          </Card>

          {/* Teléfonos */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                <Phone className="h-4 w-4" />
                Teléfonos
              </div>
              <Chip>{detail.phones.length}</Chip>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[color:var(--muted)]">
                  Agregar teléfono
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 999888777"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                             px-3 py-2 text-sm outline-none transition-all duration-200
                             focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
                />
              </div>

              <Button
                variant="primary"
                icon={Plus}
                type="button"
                onClick={onAddPhone}
                disabled={phoneSaving || !phone.trim()}
              >
                {phoneSaving ? "Guardando..." : "Agregar"}
              </Button>
            </div>

            {detail.phones.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">
                Aún no hay teléfonos registrados.
              </div>
            ) : (
              <div className="space-y-2">
                {detail.phones.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)]
                               bg-[color:var(--surface)] px-4 py-3"
                  >
                    <div className="text-sm font-semibold">{p.phone}</div>

                    <Button
                      variant="danger"
                      icon={Trash2}
                      type="button"
                      onClick={() => onDeletePhone(p.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Mascotas */}
          <Card className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                <PawPrint className="h-4 w-4" />
                Mascotas
              </div>

              <Link href={`/pets/new?clientId=${clientId}`}>
                <Button variant="primary" icon={UserPlus} type="button">
                  Agregar mascota
                </Button>
              </Link>
            </div>

            {detail.pets.length === 0 ? (
              <div className="text-sm text-[color:var(--muted)]">
                Sin mascotas todavía.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {detail.pets.map((pet) => {
                  const src = getPetThumbSrc(pet);

                  return (
                    <div
                      key={pet.id}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                    >
                      {/* ✅ Miniatura real si existe, si no placeholder */}
                      <div className="mb-3 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/50">
                        {src ? (
                          <img
                            src={src}
                            alt={pet.name}
                            className="h-32 w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center p-6 text-sm text-[color:var(--muted)]">
                            Sin foto aún
                          </div>
                        )}
                      </div>

                      <div className="text-sm font-semibold">{pet.name}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        Código: {pet.code}
                      </div>

                      <div className="mt-3">
                        <Link href={`/pets/${pet.id}`}>
                          <Button variant="secondaryOutline" icon={Eye} type="button">
                            Ver mascota
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
