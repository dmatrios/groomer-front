"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, PawPrint, Scale, StickyNote, Cat, Dog } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { ApiError } from "@/shared/http/apiError";

import {
  petsApi,
  type PetUpdateRequest,
  type PetSize,
  type PetTemperament,
  type PetSpecies,
} from "@/features/pets/api/petsApi";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-[color:var(--muted)]">{children}</label>;
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

function SkeletonLine({ w = "w-full" }: { w?: string }) {
  return <div className={`h-4 ${w} rounded-full bg-[color:var(--surface)] opacity-70`} />;
}

const petSizeUI: Record<PetSize, string> = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
};

const petTemperamentUI: Record<PetTemperament, string> = {
  CALM: "Tranquilo",
  NORMAL: "Normal",
  AGGRESSIVE: "Agresivo",
};

const petSpeciesUI: Record<PetSpecies, { label: string; Icon: any }> = {
  DOG: { label: "Perro", Icon: Dog },
  CAT: { label: "Gato", Icon: Cat },
};

function isValidNumberOrEmpty(v: string) {
  if (!v.trim()) return true;
  return /^(\d+)(\.\d+)?$/.test(v.trim());
}

export default function EditPetPage() {
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();

  const petId = useMemo(() => Number(params.id), [params.id]);

  // ✅ mantener regreso a listado (paginación/filtro)
  const from = sp.get("from");
  const backHref = from ? from : `/pets`;
  const detailHref = `/pets/${petId}?from=${encodeURIComponent(backHref)}`;

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("DOG");
  const [size, setSize] = useState<PetSize>("SMALL");
  const [temperament, setTemperament] = useState<PetTemperament>("CALM");
  const [weight, setWeight] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameTrim = name.trim();
  const nameOk = nameTrim.length >= 2;

  const weightOk = isValidNumberOrEmpty(weight);
  const weightValue = weight.trim() && weightOk ? Number(weight.trim()) : null;

  const canSubmit = nameOk && weightOk && !saving && !loading;

  useEffect(() => {
    if (!Number.isFinite(petId)) return;

    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await petsApi.getById(petId);
        const p = res.data;

        if (!mounted) return;

        setName(p?.name ?? "");
        setSpecies((p?.species ?? "DOG") as PetSpecies);
        setSize((p?.size ?? "SMALL") as PetSize);
        setTemperament((p?.temperament ?? "CALM") as PetTemperament);
        setWeight(p?.weight != null ? String(p.weight) : "");
        setNotes(p?.notes ?? "");

        setLoading(false);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "No se pudo cargar la mascota";

        if (!mounted) return;
        setError(msg);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [petId]);

  async function onSave() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);

    const payload: PetUpdateRequest = {
      name: nameTrim,
      species,
      size,
      temperament,
      weight: weightValue,
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      await petsApi.update(petId, payload);
      router.push(detailHref);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo guardar";

      setError(msg);
      setSaving(false);
    }
  }

  const SpeciesIcon = petSpeciesUI[species].Icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Editar mascota</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Actualiza datos básicos. Las fotos se gestionan en el detalle.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={detailHref}>
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>
        </div>
      </Card>

      {error && <ErrorBox message={error} />}

      <Card className="space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <SkeletonLine w="w-40" />
              <SkeletonLine />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <SkeletonLine w="w-28" />
                <SkeletonLine />
              </div>
              <div className="space-y-2">
                <SkeletonLine w="w-28" />
                <SkeletonLine />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <SkeletonLine w="w-28" />
                <SkeletonLine />
              </div>
              <div className="space-y-2">
                <SkeletonLine w="w-28" />
                <SkeletonLine />
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonLine w="w-28" />
              <div className="h-24 w-full rounded-2xl bg-[color:var(--surface)] opacity-70" />
            </div>
          </div>
        ) : (
          <>
            {/* Nombre + Peso */}
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
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                             px-3 py-2 text-sm outline-none transition-all duration-200
                             focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
                />

                <Helper>{nameOk ? "OK." : "Min 2 caracteres."}</Helper>
              </div>

              <div className="space-y-1">
                <FieldLabel>
                  <span className="inline-flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Peso (kg) (opcional)
                  </span>
                </FieldLabel>

                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ej: 8.5"
                  inputMode="decimal"
                  className={`w-full rounded-xl border bg-[color:var(--surface)]
                             px-3 py-2 text-sm outline-none transition-all duration-200
                             focus:ring-2 focus:ring-[color:var(--brand-cyan)]
                             ${weightOk ? "border-[color:var(--border)]" : "border-red-400"}`}
                />

                <Helper>{weightOk ? "Si no aplica, déjalo vacío." : "Formato inválido. Ej: 8 o 8.5"}</Helper>
              </div>
            </div>

            {/* Species + Size */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <FieldLabel>Tipo (especie)</FieldLabel>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpecies("DOG")}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200
                      ${species === "DOG" ? "border-[color:var(--brand-cyan)] shadow-sm" : "border-[color:var(--border)]"}
                      hover:shadow-md`}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Dog className="h-4 w-4" /> Perro
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpecies("CAT")}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200
                      ${species === "CAT" ? "border-[color:var(--brand-cyan)] shadow-sm" : "border-[color:var(--border)]"}
                      hover:shadow-md`}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Cat className="h-4 w-4" /> Gato
                    </span>
                  </button>
                </div>

                <Helper>
                  Seleccionado:{" "}
                  <span className="inline-flex items-center gap-2 font-semibold text-[color:var(--text)]">
                    <SpeciesIcon className="h-4 w-4" /> {petSpeciesUI[species].label}
                  </span>
                </Helper>
              </div>

              <div className="space-y-1">
                <FieldLabel>Tamaño</FieldLabel>

                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as PetSize)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                             px-3 py-2 text-sm outline-none transition-all duration-200
                             focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
                >
                  <option value="SMALL">Pequeño (SMALL)</option>
                  <option value="MEDIUM">Mediano (MEDIUM)</option>
                  <option value="LARGE">Grande (LARGE)</option>
                </select>

                <Helper>{petSizeUI[size]}</Helper>
              </div>
            </div>

            {/* Temperament */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <FieldLabel>Temperamento</FieldLabel>

                <select
                  value={temperament}
                  onChange={(e) => setTemperament(e.target.value as PetTemperament)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                             px-3 py-2 text-sm outline-none transition-all duration-200
                             focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
                >
                  <option value="CALM">Tranquilo (CALM)</option>
                  <option value="NORMAL">Normal (NORMAL)</option>
                  <option value="AGGRESSIVE">Agresivo (AGGRESSIVE)</option>
                </select>

                <Helper>{petTemperamentUI[temperament]}</Helper>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <FieldLabel>
                <span className="inline-flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Notas (opcional)
                </span>
              </FieldLabel>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Observaciones..."
                className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]
                           px-3 py-2 text-sm outline-none transition-all duration-200
                           focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              />

              <Helper>Útil para: bozal, alergias, cuidados, etc.</Helper>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Link href={detailHref} className="w-full sm:w-auto">
                <Button variant="secondaryOutline" type="button" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>

              <Button
                variant="primary"
                icon={Save}
                type="button"
                onClick={onSave}
                disabled={!canSubmit}
                className="w-full sm:w-auto"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
