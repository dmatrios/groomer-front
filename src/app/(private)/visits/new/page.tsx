"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  PawPrint,
  CalendarPlus,
  StickyNote,
  Search,
  X,
  Plus,
  Trash2,
  Receipt,
  BadgeDollarSign,
  User,
  Dog,
  Pencil,
  AlertTriangle,
  Calculator,
  Phone,
  Sparkles,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Modal } from "@/shared/ui/components/Modal";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";

import { usePetPicker } from "@/features/appointments/hooks/usePetPicker";

import {
  useZonesCatalog,
  useTreatmentTypesCatalog,
  useMedicinesCatalog,
} from "@/features/catalogs/hooks/useCatalogs";

import { petsApi, type PetResponse, type PetCreateRequest } from "@/features/pets/api/petsApi";

import {
  visitsApi,
  type VisitCreateRequest,
  type VisitItemCategory,
  type PaymentStatus,
  type PaymentMethod,
} from "@/features/visits/api/visitsApi";

import { clientsApi, type ClientResponse, type ClientCreateRequest } from "@/features/clients/api/clientsApi";
import { toIsoLocal } from "@/features/visits/utils/dates";
import { visitItemCategoryUI } from "@/features/visits/ui/visitItemCategoryUI";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";

/* ======================================================
   UI HELPERS
   ====================================================== */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-[color:var(--muted)]">{children}</label>;
}

function Helper({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[color:var(--muted)]">{children}</p>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {children}
    </span>
  );
}

/* ======================================================
   TYPES
   ====================================================== */

type PickerMode = "EXISTING" | "NEW";
type DetailMode = "NONE" | "TEXT";

type UIItem = {
  id: string;
  category: VisitItemCategory;
  price: string;

  detailMode: DetailMode;
  detailText: string;

  treatmentTypeId: number | null;
  treatmentTypeText: string;

  medicineId: number | null;
  medicineText: string;

  nextDate: string;
};

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

/* ======================================================
   PET ENUMS (UI)
   ====================================================== */

type PetSize = "SMALL" | "MEDIUM" | "LARGE";
type PetTemperament = "CALM" | "NORMAL" | "AGGRESSIVE";
type PetSpecies = "DOG" | "CAT";

const petSizeUI: Record<PetSize, { label: string }> = {
  SMALL: { label: "Pequeño" },
  MEDIUM: { label: "Mediano" },
  LARGE: { label: "Grande" },
};

const petTemperamentUI: Record<PetTemperament, { label: string }> = {
  CALM: { label: "Tranquilo" },
  NORMAL: { label: "Normal" },
  AGGRESSIVE: { label: "Agresivo" },
};

const petSpeciesUI: Record<PetSpecies, { label: string }> = {
  DOG: { label: "Perro" },
  CAT: { label: "Gato" },
};

/* ======================================================
   PHONES HELPERS (ligero)
   ====================================================== */

function normalizePhoneInput(raw: string) {
  const cleaned = raw.replace(/[^\d+\s]/g, "");
  return cleaned.replace(/\s{2,}/g, " ");
}

function isPhoneValidLight(v: string) {
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 6;
}

/* ======================================================
   NOTES BUILDER (mejor opción sin cambiar backend)
   - Tu backend NO guarda "detail" por item (solo category/price/treatmentDetail).
   - Para no perder el dato, consolidamos esos "detalles" en notes de la visita.
   ====================================================== */

function mergeNotes(base: string, items: UIItem[]) {
  const baseTrimmed = (base ?? "").trim();

  const lines = items
    .filter((it) => it.category !== "TREATMENT" && it.detailMode === "TEXT" && it.detailText.trim().length > 0)
    .map((it) => {
      const cat =
        visitItemCategoryUI?.[it.category]?.label ??
        (it.category === "BATH"
          ? "Baño"
          : it.category === "HAIRCUT"
            ? "Corte"
            : it.category === "OTHER"
              ? "Otro"
              : String(it.category));

      return `• ${cat}: ${it.detailText.trim()}`;
    });

  if (lines.length === 0) return baseTrimmed || null;

  const joined = lines.join("\n");
  const combined = baseTrimmed ? `${baseTrimmed}\n\nDetalles:\n${joined}` : `Detalles:\n${joined}`;

  // Backend notes max 500: recortamos suave (sin romper UX)
  const trimmed500 = combined.length > 500 ? combined.slice(0, 497).trimEnd() + "…" : combined;

  return trimmed500 || null;
}

/* ======================================================
   PAGE
   ====================================================== */

export default function NewVisitPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const errModal = useErrorModal();

  /* ----------------------------------
     appointmentId
  ---------------------------------- */
  const appointmentId = useMemo(() => {
    const raw = sp.get("appointmentId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [sp]);

  /* ----------------------------------
     Premium: Auto-crear cita si es walk-in
     - Solo aplica si appointmentId === null
  ---------------------------------- */
  const [autoCreateAppointment, setAutoCreateAppointment] = useState<boolean>(false);

  useEffect(() => {
    // Si viene appointmentId, este toggle no aplica
    if (appointmentId != null) setAutoCreateAppointment(false);
  }, [appointmentId]);

  /* ----------------------------------
     Mascota: modo
  ---------------------------------- */
  const [mode, setMode] = useState<PickerMode>("EXISTING");

  /* ----------------------------------
     EXISTING: Pet Picker
  ---------------------------------- */
  const petsPicker = usePetPicker();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);

  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null);
  const [clientLoading, setClientLoading] = useState(false);

  async function hydrateClient(clientId: number) {
    setClientLoading(true);
    try {
      const res = await clientsApi.getById(clientId);
      setSelectedClient(res.data ?? null);
    } finally {
      setClientLoading(false);
    }
  }

  function selectPet(p: PetResponse) {
    setSelectedPet(p);
    petsPicker.setQuery(`${p.name} (${p.code})`);
    setOpenDropdown(false);
  }

  function clearSelectedPet() {
    setSelectedPet(null);
    setSelectedClient(null);
    petsPicker.setQuery("");
    setOpenDropdown(false);
  }

  useEffect(() => {
    if (mode === "EXISTING" && selectedPet?.clientId) hydrateClient(selectedPet.clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedPet?.clientId]);

  /* ----------------------------------
     NEW: Cliente + Mascota
  ---------------------------------- */
  const [newClient, setNewClient] = useState<ClientCreateRequest>({
    firstName: "",
    lastName: "",
    zoneId: null,
    zoneText: null,
    notes: null,
  });

  const [clientPhones, setClientPhones] = useState<string[]>([""]);

  const [newPet, setNewPet] = useState<Omit<PetCreateRequest, "clientId">>({
    name: "",
    species: "DOG",
    size: "MEDIUM",
    temperament: "CALM",
    weight: null,
    notes: null,
  });

  const [weightText, setWeightText] = useState<string>("");

  useEffect(() => {
    if (mode === "NEW") setWeightText(newPet.weight == null ? "" : String(newPet.weight));
    else setWeightText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === "NEW") {
      setClientPhones((p) => (p.length ? p : [""]));
    } else {
      setClientPhones([""]);
    }
  }, [mode]);

  /* ----------------------------------
     Catalogs
  ---------------------------------- */
  const zones = useZonesCatalog();
  const treatmentTypes = useTreatmentTypesCatalog();
  const medicines = useMedicinesCatalog();

  const zoneItems = useMemo(
    () =>
      zones.items.map((z) => ({
        id: z.id,
        label: z.name,
        subLabel: z.normalizedName,
      })),
    [zones.items]
  );

  const treatmentTypeItems = useMemo(
    () =>
      treatmentTypes.items.map((t) => ({
        id: t.id,
        label: t.name,
        subLabel: t.normalizedName,
      })),
    [treatmentTypes.items]
  );

  const medicineItems = useMemo(
    () =>
      medicines.items.map((m) => ({
        id: m.id,
        label: m.name,
        subLabel: m.normalizedName,
      })),
    [medicines.items]
  );

  /* ----------------------------------
     Visit data
  ---------------------------------- */
  const [visitedAt, setVisitedAt] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return toIsoLocal(d).slice(0, 16);
  });

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<UIItem[]>([
    {
      id: uid(),
      category: "BATH",
      price: "",
      detailMode: "NONE",
      detailText: "",
      treatmentTypeId: null,
      treatmentTypeText: "",
      medicineId: null,
      medicineText: "",
      nextDate: "",
    },
  ]);

  /* ----------------------------------
     Payment
  ---------------------------------- */
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [amountPaid, setAmountPaid] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!paymentEnabled) return;

    if (paymentStatus === "PENDING") {
      setPaymentMethod("");
      setAmountPaid("");
      return;
    }
    if (paymentStatus === "PAID") {
      setAmountPaid("");
      return;
    }
  }, [paymentStatus, paymentEnabled]);

  useEffect(() => {
    if (!paymentEnabled) {
      setPaymentStatus("PENDING");
      setPaymentMethod("");
      setAmountPaid("");
    }
  }, [paymentEnabled]);

  /* ----------------------------------
     Totals
  ---------------------------------- */
  const totalAmount = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      const n = Number(it.price);
      if (Number.isFinite(n) && n > 0) sum += n;
    }
    return sum;
  }, [items]);

  /* ----------------------------------
     Items helpers
  ---------------------------------- */
  function addItem() {
    setItems((p) => [
      ...p,
      {
        id: uid(),
        category: "BATH",
        price: "",
        detailMode: "NONE",
        detailText: "",
        treatmentTypeId: null,
        treatmentTypeText: "",
        medicineId: null,
        medicineText: "",
        nextDate: "",
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<UIItem>) {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  /* ----------------------------------
     Phones helpers
  ---------------------------------- */
  const phonesToSave = useMemo(() => {
    return clientPhones.map((p) => p.trim()).filter((p) => p.length > 0);
  }, [clientPhones]);

  function addPhoneRow() {
    setClientPhones((p) => {
      if (p.length >= 5) return p;
      return [...p, ""];
    });
  }

  function removePhoneRow(idx: number) {
    setClientPhones((p) => {
      const next = p.filter((_, i) => i !== idx);
      return next.length ? next : [""];
    });
  }

  function updatePhoneRow(idx: number, value: string) {
    const v = normalizePhoneInput(value);
    setClientPhones((p) => p.map((x, i) => (i === idx ? v : x)));
  }

  /* ----------------------------------
     Validaciones UX
  ---------------------------------- */
  const canSubmit = useMemo(() => {
    if (!visitedAt) return false;
    if (items.length === 0) return false;

    for (const it of items) {
      const price = Number(it.price);
      if (!Number.isFinite(price) || price <= 0) return false;

      if (it.category === "TREATMENT") {
        if (!it.treatmentTypeId && !it.treatmentTypeText.trim()) return false;
        if (!it.medicineId && !it.medicineText.trim()) return false;
      } else {
        if (it.detailMode === "TEXT" && !it.detailText.trim()) return false;
      }
    }

    if (paymentEnabled) {
      if (paymentStatus === "PAID" && !paymentMethod) return false;

      if (paymentStatus === "PARTIAL") {
        const ap = Number(amountPaid);
        if (!paymentMethod || !Number.isFinite(ap) || ap <= 0) return false;
        if (totalAmount > 0 && ap >= totalAmount) return false;
      }
    }

    if (mode === "EXISTING" && !selectedPet?.id) return false;

    if (mode === "NEW") {
      if (!newClient.firstName.trim() || !newClient.lastName.trim() || !newPet.name.trim()) return false;

      for (const ph of phonesToSave) {
        if (!isPhoneValidLight(ph)) return false;
      }
    }

    return !saving;
  }, [
    visitedAt,
    items,
    paymentEnabled,
    paymentStatus,
    paymentMethod,
    amountPaid,
    totalAmount,
    mode,
    selectedPet,
    newClient,
    newPet,
    phonesToSave,
    saving,
  ]);

  /* ----------------------------------
     Payload
  ---------------------------------- */
  function buildVisitPayload(petId: number): VisitCreateRequest {
    const visitedAtIso = visitedAt.length === 16 ? `${visitedAt}:00` : visitedAt;

    return {
      petId,
      appointmentId,
      autoCreateAppointment: appointmentId == null ? autoCreateAppointment : null,

      visitedAt: visitedAtIso,

      // ✅ Mejor opción sin tocar backend: consolidar detalles de items (no-treatment) en notes
      notes: mergeNotes(notes, items),

      items: items.map((it) => ({
        category: it.category,
        price: Number(it.price),
        treatmentDetail:
          it.category === "TREATMENT"
            ? {
                treatmentTypeId: it.treatmentTypeId,
                treatmentTypeText: it.treatmentTypeId ? null : it.treatmentTypeText.trim(),
                medicineId: it.medicineId,
                medicineText: it.medicineId ? null : it.medicineText.trim(),
                nextDate: it.nextDate || null,
              }
            : null,
      })),

      payment: !paymentEnabled
        ? null
        : {
            status: paymentStatus,
            method: paymentStatus === "PENDING" ? null : (paymentMethod || null),
            amountPaid: paymentStatus === "PARTIAL" ? Number(amountPaid) : null,
          },
    };
  }

  /* ----------------------------------
     Submit
  ---------------------------------- */
  async function onSubmit() {
    if (!canSubmit) return;
    setSaving(true);

    try {
      let petId: number;

      if (mode === "EXISTING") {
        petId = Number(selectedPet!.id);
      } else {
        const c = await clientsApi.create({
          firstName: newClient.firstName.trim(),
          lastName: newClient.lastName.trim(),
          zoneId: newClient.zoneId,
          zoneText: newClient.zoneId ? null : (newClient.zoneText?.trim() || null),
          notes: newClient.notes?.trim() || null,
        });

        const clientId = c.data!.id;

        if (phonesToSave.length > 0) {
          await Promise.all(phonesToSave.map((ph) => clientsApi.addPhone(clientId, ph)));
        }

        const p = await petsApi.create({
          clientId,
          name: newPet.name.trim(),
          species: newPet.species,
          size: newPet.size,
          temperament: newPet.temperament,
          weight: newPet.weight,
          notes: newPet.notes?.trim() || null,
        });

        petId = p.data!.id;
      }

      const res = await visitsApi.create(buildVisitPayload(petId));
      router.push(`/visits/${res.data!.id}`);
    } catch (e) {
      errModal.show(e, "No se pudo registrar la atención");
    } finally {
      setSaving(false);
    }
  }

  const modalTitle = useMemo(() => {
    const s = errModal.state.status;
    const code = errModal.state.code;
    if (!s) return errModal.state.title || "Error";
    return code ? `Error ${s} · ${code}` : `Error ${s}`;
  }, [errModal.state.status, errModal.state.code, errModal.state.title]);

  const temperamentTone =
    mode === "EXISTING"
      ? (selectedPet?.temperament as PetTemperament | undefined)
      : (newPet.temperament as PetTemperament | undefined);

  const showAggressiveWarning = temperamentTone === "AGGRESSIVE";

  /* ----------------------------------
     RENDER
  ---------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Nueva atención</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Registra servicios/tratamientos y pago.
            {appointmentId ? ` Vinculada a cita #${appointmentId}.` : " Sin cita vinculada."}
          </p>

          {/* ✅ Premium: auto-cita solo si es walk-in */}
          {appointmentId == null && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Premium
              </Chip>

              <Button
                type="button"
                variant={autoCreateAppointment ? "primaryOutline" : "secondaryOutline"}
                onClick={() => setAutoCreateAppointment((v) => !v)}
                disabled={saving}
              >
                {autoCreateAppointment ? "Auto-cita: ACTIVADA" : "Auto-cita: DESACTIVADA"}
              </Button>

              <span className="text-xs text-[color:var(--muted)]">
                Si está activada, el backend creará una cita automáticamente y la marcará atendida.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/visits">
            <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
              Volver
            </Button>
          </Link>

          <Button variant="primary" icon={Save} type="button" onClick={onSubmit} disabled={!canSubmit}>
            Guardar atención
          </Button>
        </div>
      </Card>

      {/* Total */}
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <div>
            <div className="text-sm font-semibold">Total</div>
            <div className="text-xs text-[color:var(--muted)]">Suma de precios de todos los items</div>
          </div>
        </div>

        <Chip>S/ {totalAmount.toFixed(2)}</Chip>
      </Card>

      {/* Mascota */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Mascota</div>
              <div className="text-xs text-[color:var(--muted)]">
                Selecciona una existente o registra una nueva (cliente + mascota).
              </div>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
            <Button
              type="button"
              className="px-3"
              variant={mode === "EXISTING" ? "primaryOutline" : "ghost"}
              onClick={() => setMode("EXISTING")}
            >
              Existente
            </Button>
            <Button
              type="button"
              className="px-3"
              variant={mode === "NEW" ? "primaryOutline" : "ghost"}
              onClick={() => setMode("NEW")}
            >
              Nueva mascota
            </Button>
          </div>
        </div>

        {showAggressiveWarning && (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold">⚠ Mascota marcada como “Agresivo”</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  Recomendación: manipulación con cuidado, bozal si aplica y deja notas claras.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING */}
        {mode === "EXISTING" && (
          <div className="space-y-3">
            <div>
              <FieldLabel>
                <Search className="inline h-4 w-4 mr-1" />
                Buscar mascota
              </FieldLabel>

              <div className="relative mt-1">
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                  <Search className="h-4 w-4 text-[color:var(--muted)]" />
                  <input
                    value={petsPicker.query}
                    onChange={(e) => {
                      petsPicker.setQuery(e.target.value);
                      setOpenDropdown(true);
                      setSelectedPet(null);
                      setSelectedClient(null);
                    }}
                    onFocus={() => setOpenDropdown(true)}
                    placeholder="Buscar por nombre, código (PT-...), id..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  {petsPicker.query && (
                    <button
                      type="button"
                      onClick={clearSelectedPet}
                      className="rounded-lg p-1 transition-all duration-200 hover:shadow-sm"
                      aria-label="Limpiar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {openDropdown && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
                    <div className="max-h-72 overflow-auto p-2">
                      {petsPicker.loading ? (
                        <div className="p-3 text-sm text-[color:var(--muted)]">Cargando mascotas...</div>
                      ) : petsPicker.error ? (
                        <div className="p-3 text-sm">
                          <div className="font-semibold">Error</div>
                          <div className="text-[color:var(--muted)]">{petsPicker.error}</div>
                          <div className="mt-2">
                            <Button variant="secondaryOutline" type="button" onClick={petsPicker.refresh}>
                              Reintentar
                            </Button>
                          </div>
                        </div>
                      ) : petsPicker.items.length === 0 ? (
                        <div className="p-3 text-sm text-[color:var(--muted)]">Sin resultados.</div>
                      ) : (
                        <div className="space-y-1">
                          {petsPicker.items.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectPet(p)}
                              className="w-full rounded-xl border border-transparent px-3 py-2 text-left transition-all duration-200 hover:border-[color:var(--border)] hover:shadow-sm"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold">{p.name}</div>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                                  <span>#{p.id}</span>
                                  <span>·</span>
                                  <span>{p.code}</span>
                                  <span>·</span>
                                  <span>Cliente #{p.clientId}</span>
                                  {p.temperament && (
                                    <>
                                      <span>·</span>
                                      <span>
                                        Temp:{" "}
                                        {petTemperamentUI[p.temperament as PetTemperament]?.label ??
                                          String(p.temperament)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-2">
                      <span className="text-xs text-[color:var(--muted)]">
                        Mostrando hasta 50 (total: {petsPicker.total})
                      </span>
                      <Button variant="secondaryOutline" type="button" onClick={() => setOpenDropdown(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {openDropdown && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(false)} />}
            </div>

            {selectedPet ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Chip>
                    Mascota: <span className="ml-1 font-semibold">{selectedPet.name}</span>
                  </Chip>
                  <Chip>Código: {selectedPet.code}</Chip>
                  <Chip>Cliente #{selectedPet.clientId}</Chip>
                  {selectedPet.size && (
                    <Chip>
                      Tamaño: {petSizeUI[selectedPet.size as PetSize]?.label ?? String(selectedPet.size)}
                    </Chip>
                  )}
                  {selectedPet.temperament && (
                    <Chip>
                      Temp:{" "}
                      {petTemperamentUI[selectedPet.temperament as PetTemperament]?.label ??
                        String(selectedPet.temperament)}
                    </Chip>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/pets/${selectedPet.id}/edit`}>
                    <Button variant="primaryOutline" icon={Pencil} type="button">
                      Editar mascota
                    </Button>
                  </Link>

                  {selectedPet.clientId ? (
                    <Link href={`/clients/${selectedPet.clientId}/edit`}>
                      <Button variant="secondaryOutline" icon={Pencil} type="button">
                        Editar cliente
                      </Button>
                    </Link>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div className="font-semibold">Cliente</div>
                  </div>

                  <div className="mt-2 text-[color:var(--muted)]">
                    {clientLoading ? (
                      "Cargando cliente..."
                    ) : selectedClient ? (
                      <>
                        <div>
                          <span className="font-semibold">Nombre:</span> {selectedClient.firstName}{" "}
                          {selectedClient.lastName}
                        </div>
                        <div>
                          <span className="font-semibold">Código:</span> {selectedClient.code}
                        </div>
                        {selectedClient.zoneText && (
                          <div>
                            <span className="font-semibold">Zona:</span> {selectedClient.zoneText}
                          </div>
                        )}
                      </>
                    ) : (
                      "No se pudo cargar el detalle del cliente (pero puedes continuar)."
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Helper>Selecciona una mascota para continuar.</Helper>
            )}
          </div>
        )}

        {/* NEW */}
        {mode === "NEW" && (
          <div className="space-y-5">
            {/* Cliente */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Registro rápido de Cliente</div>
                  <div className="text-xs text-[color:var(--muted)]">Obligatorio para crear una mascota nueva.</div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <FieldLabel>Nombres</FieldLabel>
                  <input
                    value={newClient.firstName ?? ""}
                    onChange={(e) => setNewClient((s) => ({ ...s, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: María"
                  />
                  {!newClient.firstName?.trim() && <Helper>Obligatorio.</Helper>}
                </div>

                <div>
                  <FieldLabel>Apellidos</FieldLabel>
                  <input
                    value={newClient.lastName ?? ""}
                    onChange={(e) => setNewClient((s) => ({ ...s, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: Pérez"
                  />
                  {!newClient.lastName?.trim() && <Helper>Obligatorio.</Helper>}
                </div>

                {/* ✅ Teléfonos multi */}
                <div className="lg:col-span-2">
                  <FieldLabel>
                    <Phone className="inline h-4 w-4 mr-1" />
                    Teléfonos (opcional)
                  </FieldLabel>

                  <div className="mt-2 space-y-2">
                    {clientPhones.map((ph, idx) => {
                      const showInvalid = ph.trim().length > 0 && !isPhoneValidLight(ph.trim());

                      return (
                        <div key={idx} className="flex flex-wrap items-center gap-2">
                          <input
                            value={ph}
                            onChange={(e) => updatePhoneRow(idx, e.target.value)}
                            className="w-full flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                            placeholder={idx === 0 ? "Ej: +51 999 888 777" : "Otro teléfono..."}
                            inputMode="tel"
                          />

                          <Button
                            type="button"
                            variant="secondaryOutline"
                            icon={Trash2}
                            onClick={() => removePhoneRow(idx)}
                            disabled={clientPhones.length === 1 && !ph.trim()}
                          >
                            Quitar
                          </Button>

                          {showInvalid && (
                            <div className="w-full">
                              <Helper>Teléfono inválido (mín. 6 dígitos). Puedes dejarlo vacío si no aplica.</Helper>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="primaryOutline"
                        icon={Plus}
                        onClick={addPhoneRow}
                        disabled={clientPhones.length >= 5}
                      >
                        Agregar teléfono
                      </Button>
                      <Helper>Máximo 5. Se guardan como lista (cliente → teléfonos).</Helper>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <AutocompleteInput
                    label="Zona"
                    placeholder="Buscar zona..."
                    items={zoneItems}
                    value={newClient.zoneText ?? ""}
                    onChange={(v) =>
                      setNewClient((s) => ({
                        ...s,
                        zoneText: v,
                        zoneId: null,
                      }))
                    }
                    onPick={(item) =>
                      setNewClient((s) => ({
                        ...s,
                        zoneId: Number(item.id),
                        zoneText: item.label,
                      }))
                    }
                    disabled={zones.loading}
                  />

                  <div className="flex items-center gap-2">
                    <Helper>¿No existe la zona?</Helper>
                    <Link href="/catalogs/zones">
                      <Button variant="secondaryOutline" type="button">
                        Crear zona
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Notas (opcional)</FieldLabel>
                  <input
                    value={newClient.notes ?? ""}
                    onChange={(e) => setNewClient((s) => ({ ...s, notes: e.target.value || null }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: Cliente frecuente"
                  />
                </div>
              </div>
            </div>

            {/* Mascota */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="flex items-center gap-2">
                <Dog className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Registro rápido de Mascota</div>
                  <div className="text-xs text-[color:var(--muted)]">Se creará junto al cliente al guardar.</div>
                </div>
              </div>

              {showAggressiveWarning && (
                <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">⚠ Temperamento: Agresivo</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        Tip: agrega en “Notas mascota” recomendaciones (bozal, no tocar orejas, etc.).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <FieldLabel>Nombre mascota</FieldLabel>
                  <input
                    value={newPet.name ?? ""}
                    onChange={(e) => setNewPet((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: Luna"
                  />
                  {!newPet.name?.trim() && <Helper>Obligatorio.</Helper>}
                </div>

                <div>
                  <FieldLabel>Especie</FieldLabel>
                  <select
                    value={newPet.species}
                    onChange={(e) => setNewPet((s) => ({ ...s, species: e.target.value as any }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                  >
                    <option value="DOG">{petSpeciesUI.DOG.label}</option>
                    <option value="CAT">{petSpeciesUI.CAT.label}</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Tamaño</FieldLabel>
                  <select
                    value={newPet.size}
                    onChange={(e) => setNewPet((s) => ({ ...s, size: e.target.value as any }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                  >
                    <option value="SMALL">{petSizeUI.SMALL.label}</option>
                    <option value="MEDIUM">{petSizeUI.MEDIUM.label}</option>
                    <option value="LARGE">{petSizeUI.LARGE.label}</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Temperamento</FieldLabel>
                  <select
                    value={newPet.temperament}
                    onChange={(e) => setNewPet((s) => ({ ...s, temperament: e.target.value as any }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                  >
                    <option value="CALM">{petTemperamentUI.CALM.label}</option>
                    <option value="NORMAL">{petTemperamentUI.NORMAL.label}</option>
                    <option value="AGGRESSIVE">{petTemperamentUI.AGGRESSIVE.label}</option>
                  </select>
                </div>

                {/* Peso */}
                <div>
                  <FieldLabel>Peso (opcional)</FieldLabel>
                  <input
                    type="text"
                    value={weightText}
                    onChange={(e) => {
                      const raw = e.target.value.replace(",", ".");
                      if (!/^\d*\.?\d*$/.test(raw)) return;

                      setWeightText(raw);

                      if (!raw || raw === ".") {
                        setNewPet((s) => ({ ...s, weight: null }));
                        return;
                      }
                      if (raw.endsWith(".")) return;

                      const num = Number(raw);
                      setNewPet((s) => ({ ...s, weight: Number.isFinite(num) ? num : null }));
                    }}
                    onBlur={() => {
                      const raw = weightText.replace(",", ".");
                      if (!raw || raw === "." || raw.endsWith(".")) {
                        const fixed = raw.endsWith(".") ? raw.slice(0, -1) : raw;
                        setWeightText(fixed);
                        const num = fixed ? Number(fixed) : NaN;
                        setNewPet((s) => ({ ...s, weight: Number.isFinite(num) ? num : null }));
                        return;
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: 7.6"
                    inputMode="decimal"
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Notas mascota (opcional)</FieldLabel>
                  <input
                    value={newPet.notes ?? ""}
                    onChange={(e) => setNewPet((s) => ({ ...s, notes: e.target.value || null }))}
                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    placeholder="Ej: No le gusta secadora / usar bozal"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Datos de visita */}
      <Card className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <FieldLabel>
              <CalendarPlus className="inline h-4 w-4 mr-1" />
              Fecha y hora (visitedAt)
            </FieldLabel>
            <input
              type="datetime-local"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <FieldLabel>
              <StickyNote className="inline h-4 w-4 mr-1" />
              Notas
            </FieldLabel>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
              placeholder="Opcional..."
            />
            <Helper>
              Si agregas “detalle” a un item (no tratamiento), se guardará aquí automáticamente para no perder info.
            </Helper>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Servicios / Tratamientos</div>
              <div className="text-xs text-[color:var(--muted)]">
                Mínimo 1 item. Precio &gt; 0. Tratamiento requiere tipo y medicamento.
              </div>
            </div>
          </div>

          <Button variant="primaryOutline" icon={Plus} type="button" onClick={addItem}>
            Agregar item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => {
            const isTreatment = it.category === "TREATMENT";
            const allowDetail = it.category !== "TREATMENT";

            return (
              <div
                key={it.id}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Item #{idx + 1}</div>

                  <Button
                    variant="secondaryOutline"
                    icon={Trash2}
                    type="button"
                    onClick={() => removeItem(it.id)}
                    disabled={items.length === 1}
                  >
                    Quitar
                  </Button>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <div>
                    <FieldLabel>Categoría</FieldLabel>
                    <select
                      value={it.category}
                      onChange={(e) => {
                        const next = e.target.value as VisitItemCategory;

                        updateItem(it.id, {
                          category: next,
                          detailMode: next === "TREATMENT" ? "NONE" : it.detailMode,
                          detailText: next === "TREATMENT" ? "" : it.detailText,
                          treatmentTypeId: next === "TREATMENT" ? it.treatmentTypeId : null,
                          treatmentTypeText: next === "TREATMENT" ? it.treatmentTypeText : "",
                          medicineId: next === "TREATMENT" ? it.medicineId : null,
                          medicineText: next === "TREATMENT" ? it.medicineText : "",
                          nextDate: next === "TREATMENT" ? it.nextDate : "",
                        });
                      }}
                      className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                    >
                      <option value="BATH">{visitItemCategoryUI?.BATH?.label ?? "Baño"}</option>
                      <option value="HAIRCUT">{visitItemCategoryUI?.HAIRCUT?.label ?? "Corte"}</option>
                      <option value="TREATMENT">{visitItemCategoryUI?.TREATMENT?.label ?? "Tratamiento"}</option>
                      <option value="OTHER">{visitItemCategoryUI?.OTHER?.label ?? "Otro"}</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Precio</FieldLabel>
                    <input
                      value={it.price}
                      onChange={(e) => updateItem(it.id, { price: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                      placeholder="Ej: 35"
                      inputMode="decimal"
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <FieldLabel>Detalle</FieldLabel>

                    {isTreatment ? (
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        Requiere tipo de tratamiento y medicamento (desde catálogos).
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant={it.detailMode === "NONE" ? "primaryOutline" : "secondaryOutline"}
                          onClick={() => updateItem(it.id, { detailMode: "NONE", detailText: "" })}
                        >
                          Sin detalle
                        </Button>
                        <Button
                          type="button"
                          variant={it.detailMode === "TEXT" ? "primaryOutline" : "secondaryOutline"}
                          onClick={() => updateItem(it.id, { detailMode: "TEXT" })}
                        >
                          Con detalle
                        </Button>
                      </div>
                    )}
                  </div>

                  {allowDetail && it.detailMode === "TEXT" && (
                    <div className="lg:col-span-3">
                      <FieldLabel>Detalle del servicio</FieldLabel>
                      <input
                        value={it.detailText}
                        onChange={(e) => updateItem(it.id, { detailText: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                        placeholder="Ej: Pelo pegado / baño medicado / nudos / etc."
                      />
                      {!it.detailText.trim() && <Helper>Si eliges “Con detalle”, este campo es obligatorio.</Helper>}
                    </div>
                  )}

                  {isTreatment && (
                    <>
                      <div className="lg:col-span-1">
                        <AutocompleteInput
                          label="Tipo de tratamiento"
                          placeholder={treatmentTypes.loading ? "Cargando..." : "Buscar tipo..."}
                          items={treatmentTypeItems}
                          value={
                            it.treatmentTypeId
                              ? (treatmentTypes.items.find((x) => x.id === it.treatmentTypeId)?.name ??
                                it.treatmentTypeText)
                              : it.treatmentTypeText
                          }
                          onChange={(v) =>
                            updateItem(it.id, {
                              treatmentTypeText: v,
                              treatmentTypeId: null,
                            })
                          }
                          onPick={(item) =>
                            updateItem(it.id, {
                              treatmentTypeId: Number(item.id),
                              treatmentTypeText: item.label,
                            })
                          }
                          disabled={treatmentTypes.loading}
                        />
                        <Helper>Selecciona del catálogo o escribe (fallback).</Helper>
                      </div>

                      <div className="lg:col-span-1">
                        <AutocompleteInput
                          label="Medicamento"
                          placeholder={medicines.loading ? "Cargando..." : "Buscar medicamento..."}
                          items={medicineItems}
                          value={
                            it.medicineId
                              ? (medicines.items.find((x) => x.id === it.medicineId)?.name ?? it.medicineText)
                              : it.medicineText
                          }
                          onChange={(v) =>
                            updateItem(it.id, {
                              medicineText: v,
                              medicineId: null,
                            })
                          }
                          onPick={(item) =>
                            updateItem(it.id, {
                              medicineId: Number(item.id),
                              medicineText: item.label,
                            })
                          }
                          disabled={medicines.loading}
                        />
                        <Helper>Selecciona del catálogo o escribe (fallback).</Helper>
                      </div>

                      <div className="lg:col-span-1">
                        <FieldLabel>Próxima fecha (opcional)</FieldLabel>
                        <input
                          type="date"
                          value={it.nextDate}
                          onChange={(e) => updateItem(it.id, { nextDate: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment */}
      <Card className="space-y-4">
        <div className="flex items-start gap-2">
          <BadgeDollarSign className="h-5 w-5" />
          <div>
            <div className="text-sm font-semibold">Pago (opcional)</div>
            <div className="text-xs text-[color:var(--muted)]">
              PENDING sin método. PARTIAL requiere método y amountPaid. PAID requiere método.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={paymentEnabled ? "primaryOutline" : "secondaryOutline"}
            type="button"
            onClick={() => setPaymentEnabled((v) => !v)}
          >
            {paymentEnabled ? "Pago: ACTIVADO" : "Pago: DESACTIVADO"}
          </Button>

          {paymentEnabled && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                <span className="text-xs text-[color:var(--muted)]">Estado</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="bg-transparent text-sm outline-none"
                >
                  <option value="PENDING">{paymentStatusUI?.PENDING?.label ?? "Pendiente"}</option>
                  <option value="PARTIAL">{paymentStatusUI?.PARTIAL?.label ?? "Parcial"}</option>
                  <option value="PAID">{paymentStatusUI?.PAID?.label ?? "Pagado"}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                <span className="text-xs text-[color:var(--muted)]">Método</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-transparent text-sm outline-none"
                  disabled={paymentStatus === "PENDING" || saving}
                >
                  <option value="">(sin método)</option>
                  <option value="CASH">Efectivo</option>
                  <option value="MOBILE_BANKING">Banca móvil (Yape/Plin/Transfer)</option>
                  <option value="CARD">Tarjeta</option>
                </select>
              </div>

              {paymentStatus === "PARTIAL" && (
                <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                  <span className="text-xs text-[color:var(--muted)]">Monto pagado</span>
                  <input
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-28 bg-transparent text-sm outline-none"
                    placeholder="Ej: 20"
                    inputMode="decimal"
                    disabled={saving}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Modal de error */}
      <Modal
        open={errModal.state.open}
        title={modalTitle}
        description="Detalle del servidor:"
        onClose={errModal.close}
        busy={saving}
      >
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-semibold">Mensaje:</span>{" "}
            <span className="text-[color:var(--muted)]">{errModal.state.message}</span>
          </div>

          {errModal.state.status != null && (
            <div className="text-sm">
              <span className="font-semibold">HTTP:</span>{" "}
              <span className="text-[color:var(--muted)]">{errModal.state.status}</span>
            </div>
          )}

          {errModal.state.code && (
            <div className="text-sm">
              <span className="font-semibold">Código:</span>{" "}
              <span className="text-[color:var(--muted)]">{errModal.state.code}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
