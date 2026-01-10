"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Star,
  Upload,
  User,
  Phone,
  History,
  ExternalLink,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { ApiError } from "@/shared/http/apiError";
import { assetUrl } from "@/shared/config/asset";

import { uploadsApi } from "@/features/uploads/api/uploadsApi";
import { petsApi } from "@/features/pets/api/petsApi";
import { usePetDetail } from "@/features/pets/hooks/usePetDetail";
import {
  clientsApi,
  type ClientResponse,
  type ClientPhoneResponse,
} from "@/features/clients/api/clientsApi";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

/* ======================================================
   PET SPECIES UI
   ====================================================== */
type PetSpecies = "DOG" | "CAT";

const petSpeciesUI: Record<PetSpecies, { label: string }> = {
  DOG: { label: "Perro" },
  CAT: { label: "Gato" },
};

function petSpeciesLabel(species?: string | null) {
  if (!species) return "";
  return petSpeciesUI[species as PetSpecies]?.label ?? String(species);
}

/* ======================================================
   PAGE
   ====================================================== */
export default function PetDetailPage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();

  const petId = useMemo(() => Number(params.id), [params.id]);

  // ✅ origen para volver con paginación/filtro
  const from = sp.get("from");
  const backHref = from ? from : "/pets";

  const detail = usePetDetail(petId);

  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /* ----------------------------------
     Cliente mini info
  ---------------------------------- */
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [phones, setPhones] = useState<ClientPhoneResponse[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  /* ----------------------------------
     ClienteId (number | null)
  ---------------------------------- */
  const clientId: number | null = detail.pet?.clientId ?? null;

  /* ----------------------------------
     Stats (veces atendida + última)
  ---------------------------------- */
  const [statsLoading, setStatsLoading] = useState(false);
  const [visitsCount, setVisitsCount] = useState<number>(0);
  const [lastVisit, setLastVisit] = useState<{
    id: number;
    visitedAt: string;
  } | null>(null);

  /* ----------------------------------
     Upload photo
  ---------------------------------- */
  async function onPickFile(file: File | null) {
    if (!file) return;

    setUploading(true);
    setLocalError(null);

    try {
      const uploaded = await uploadsApi.uploadPetPhoto(file);
      await petsApi.addPhoto(petId, uploaded.url);
      await detail.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo subir la foto";
      setLocalError(msg);
    } finally {
      setUploading(false);
    }
  }

  /* ----------------------------------
     Load Client + Phones ✅
  ---------------------------------- */
  useEffect(() => {
    if (clientId == null) return;

    let mounted = true;

    async function loadClient() {
      const id = clientId;
      if (id == null) return;

      setClientLoading(true);

      try {
        const [cRes, phRes] = await Promise.all([
          clientsApi.getById(id),
          clientsApi.listPhones(id),
        ]);

        if (!mounted) return;
        setClient(cRes.data ?? null);
        setPhones(phRes.data ?? []);
      } catch {
        if (!mounted) return;
        setClient(null);
        setPhones([]);
      } finally {
        if (mounted) setClientLoading(false);
      }
    }

    loadClient();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  /* ----------------------------------
     Load Stats
  ---------------------------------- */
  useEffect(() => {
    if (!Number.isFinite(petId)) return;

    let mounted = true;

    async function loadStats() {
      setStatsLoading(true);

      try {
        const res = await petsApi.getStats(petId);
        if (!mounted) return;

        setVisitsCount(res.data?.visitsCount ?? 0);
        setLastVisit(res.data?.lastVisit ?? null);
      } catch {
        if (!mounted) return;
        setVisitsCount(0);
        setLastVisit(null);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, [petId]);

  const pet = detail.pet;
  const mainSrc = assetUrl(pet?.mainPhotoUrl);

  // teléfono “principal” (primero)
  const phone = phones?.[0]?.phone ?? null;

  // volver encadenado
  const petSelfHref = `/pets/${petId}?from=${encodeURIComponent(backHref)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{pet ? pet.name : "Mascota"}</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Fotos, datos y acciones de la mascota.
          </p>

          {pet && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip>Código: {pet.code}</Chip>

              {"species" in (pet as any) && (pet as any).species ? (
                <Chip>Especie: {petSpeciesLabel((pet as any).species)}</Chip>
              ) : null}

              <Chip>Tamaño: {String((pet as any).size ?? "—")}</Chip>
              <Chip>Temperamento: {String((pet as any).temperament ?? "—")}</Chip>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={backHref}>
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>

          {/* ✅ Acceso rápido al historial */}
          <Link href={`/pets/${petId}/history?from=${encodeURIComponent(petSelfHref)}`}>
            <Button variant="primaryOutline" icon={History} type="button">
              Historial
            </Button>
          </Link>
        </div>
      </Card>

      {(detail.error || localError) && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
          <span className="font-semibold">Error:</span>{" "}
          <span className="text-[color:var(--muted)]">{localError ?? detail.error}</span>
        </div>
      )}

      {detail.loading ? (
        <div className="text-sm text-[color:var(--muted)]">Cargando...</div>
      ) : !pet ? (
        <Card className="p-6">
          <div className="text-sm text-[color:var(--muted)]">No se encontró la mascota.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* LEFT: Foto principal + upload */}
          <Card className="space-y-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Perfil</div>
              <Chip>{pet.mainPhotoUrl ? "Foto OK" : "Sin foto"}</Chip>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white/50">
              {mainSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainSrc} alt={pet.name} className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-[color:var(--muted)]">
                  Sin foto aún
                </div>
              )}
            </div>

            <label className="block">
              <div className="mb-2 text-xs font-semibold text-[color:var(--muted)]">
                Subir nueva foto
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="pet-photo"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
                <Button
                  variant="primary"
                  icon={Upload}
                  type="button"
                  disabled={uploading}
                  onClick={() => document.getElementById("pet-photo")?.click()}
                >
                  {uploading ? "Subiendo..." : "Seleccionar imagen"}
                </Button>

                <Chip>JPG/PNG</Chip>
              </div>
            </label>
          </Card>

          {/* RIGHT */}
          <div className="space-y-4 lg:col-span-2">
            {/* Resumen: Atenciones + Cliente */}
            <Card className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Atenciones */}
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold">
                        <History className="h-4 w-4" /> Atenciones
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {statsLoading ? "Cargando..." : "Resumen del historial"}
                      </div>
                    </div>

                    <Chip>{statsLoading ? "—" : visitsCount}</Chip>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-[color:var(--muted)]">
                      <span className="font-semibold text-[color:var(--text)]">Última:</span>{" "}
                      {statsLoading
                        ? "—"
                        : lastVisit
                        ? new Date(lastVisit.visitedAt).toLocaleString()
                        : "Sin atenciones"}
                    </div>

                    {lastVisit && (
                      <div className="mt-2">
                        <Link href={`/visits/${lastVisit.id}?from=${encodeURIComponent(petSelfHref)}`}>
                          <Button variant="secondaryOutline" icon={ExternalLink} type="button">
                            Ver última atención
                          </Button>
                        </Link>
                      </div>
                    )}

                    <div className="mt-2">
                      <Link href={`/pets/${petId}/history?from=${encodeURIComponent(petSelfHref)}`}>
                        <Button variant="primary" icon={History} type="button">
                          Ver historial
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4" /> Cliente
                  </div>

                  <div className="mt-2 text-sm text-[color:var(--muted)]">
                    {clientLoading ? (
                      "Cargando cliente..."
                    ) : client ? (
                      <>
                        <div className="font-semibold text-[color:var(--text)]">
                          {client.firstName} {client.lastName}
                        </div>

                        <div className="mt-1 inline-flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{phone ?? "Sin teléfono"}</span>
                        </div>
                      </>
                    ) : (
                      "No se pudo cargar cliente."
                    )}
                  </div>

                  {client && (
                    <div className="mt-3">
                      <Link href={`/clients/${client.id}?from=${encodeURIComponent(petSelfHref)}`}>
                        <Button variant="primaryOutline" icon={ExternalLink} type="button">
                          Ver cliente
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Notas */}
            <Card className="space-y-2">
              <div className="text-sm font-semibold">Notas</div>
              <div className="text-sm text-[color:var(--muted)]">
                {pet.notes?.trim() ? pet.notes : "—"}
              </div>
            </Card>

            {/* Galería */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4" /> Galería
                </div>
                <Chip>{detail.photos.length}</Chip>
              </div>

              {detail.photos.length === 0 ? (
                <div className="text-sm text-[color:var(--muted)]">
                  Aún no hay fotos para esta mascota.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {detail.photos.map((ph) => {
                    const src = assetUrl(ph.url);

                    return (
                      <div
                        key={ph.id}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/50">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="Foto mascota" className="h-28 w-full object-cover" />
                          ) : (
                            <div className="flex h-28 items-center justify-center text-xs text-[color:var(--muted)]">
                              Sin preview
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          {ph.primary ? (
                            <Chip>
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5" /> Principal
                              </span>
                            </Chip>
                          ) : (
                            <Button
                              variant="secondaryOutline"
                              icon={Star}
                              type="button"
                              onClick={() => detail.makePrimary(ph.id)}
                            >
                              Hacer principal
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
