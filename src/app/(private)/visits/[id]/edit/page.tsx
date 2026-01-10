"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Save,
    PawPrint,
    CalendarPlus,
    StickyNote,
    Plus,
    Trash2,
    Receipt,
    BadgeDollarSign,
    User,
    Dog,
    Pencil,
    AlertTriangle,
    Calculator,
} from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Modal } from "@/shared/ui/components/Modal";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";

import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";
import { clientsApi, type ClientResponse } from "@/features/clients/api/clientsApi";

import {
    visitsApi,
    type VisitItemCategory,
    type PaymentStatus,
    type PaymentMethod,
    // ✅ si tienes VisitUpdateRequest, mejor úsalo; si no, usamos el shape directo
} from "@/features/visits/api/visitsApi";

import { toIsoLocal } from "@/features/visits/utils/dates";
import { visitItemCategoryUI } from "@/features/visits/ui/visitItemCategoryUI";
import { paymentStatusUI } from "@/features/visits/ui/paymentStatusUI";

import {
    useTreatmentTypesCatalog,
    useMedicinesCatalog,
} from "@/features/catalogs/hooks/useCatalogs";

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

type PetTemperament = "CALM" | "NORMAL" | "AGGRESSIVE";

const petTemperamentUI: Record<PetTemperament, { label: string }> = {
    CALM: { label: "Tranquilo" },
    NORMAL: { label: "Normal" },
    AGGRESSIVE: { label: "Agresivo" },
};

/* ======================================================
   PAGE
   ====================================================== */

export default function EditVisitPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const params = useParams<{ id: string }>();
    const errModal = useErrorModal();

    const visitId = useMemo(() => Number(params.id), [params.id]);
    const from = sp.get("from");
    const backHref = from ? from : "/visits";

    const [loading, setLoading] = useState(true);

    // --- loaded ids
    const [petId, setPetId] = useState<number | null>(null);
    const [appointmentId, setAppointmentId] = useState<number | null>(null);

    // --- hydrated entities
    const [pet, setPet] = useState<PetResponse | null>(null);
    const [client, setClient] = useState<ClientResponse | null>(null);
    const [hydrating, setHydrating] = useState(false);

    // --- visit fields
    const [visitedAt, setVisitedAt] = useState<string>(() => {
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

    // payment
    const [paymentEnabled, setPaymentEnabled] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
    const [amountPaid, setAmountPaid] = useState("");

    const [saving, setSaving] = useState(false);

    /* ----------------------------------
       Catalogs
    ---------------------------------- */
    const treatmentTypes = useTreatmentTypesCatalog();
    const medicines = useMedicinesCatalog();

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
       Total
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
       Load visit
    ---------------------------------- */
    useEffect(() => {
        if (!Number.isFinite(visitId) || visitId <= 0) return;

        let mounted = true;

        async function load() {
            setLoading(true);

            try {
                // ✅ Debe existir en tu API
                const res = await visitsApi.getById(visitId);
                if (!mounted) return;

                const v = res.data!;
                // Asumimos shape típico (ajusta si tu DTO difiere)
                setPetId(v.petId);
                setAppointmentId(v.appointmentId ?? null);

                // visitedAt => input datetime-local: YYYY-MM-DDTHH:mm
                if (v.visitedAt) {
                    const dt = new Date(v.visitedAt);
                    dt.setSeconds(0, 0);
                    setVisitedAt(toIsoLocal(dt).slice(0, 16));
                }

                setNotes(v.notes ?? "");

                // items
                const mapped: UIItem[] =
                    (v.items ?? []).length > 0
                        ? v.items.map((it: any) => {
                            const isTreatment = it.category === "TREATMENT";
                            const normalDetail = it.detail ?? "";

                            return {
                                id: uid(),
                                category: it.category,
                                price: it.price != null ? String(it.price) : "",
                                detailMode: !isTreatment && normalDetail?.trim() ? "TEXT" : "NONE",
                                detailText: !isTreatment ? String(normalDetail ?? "") : "",
                                treatmentTypeId: isTreatment ? it.treatmentDetail?.treatmentTypeId ?? null : null,
                                treatmentTypeText: isTreatment ? it.treatmentDetail?.treatmentTypeText ?? "" : "",
                                medicineId: isTreatment ? it.treatmentDetail?.medicineId ?? null : null,
                                medicineText: isTreatment ? it.treatmentDetail?.medicineText ?? "" : "",
                                nextDate: isTreatment ? (it.treatmentDetail?.nextDate ?? "") : "",
                            };
                        })
                        : [
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
                        ];

                setItems(mapped);

                // payment
                if (v.payment) {
                    setPaymentEnabled(true);
                    setPaymentStatus(v.payment.status as PaymentStatus);
                    setPaymentMethod((v.payment.method ?? "") as any);
                    setAmountPaid(v.payment.amountPaid != null ? String(v.payment.amountPaid) : "");
                } else {
                    setPaymentEnabled(false);
                    setPaymentStatus("PENDING");
                    setPaymentMethod("");
                    setAmountPaid("");
                }
            } catch (e) {
                errModal.show(e, "No se pudo cargar la atención");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visitId]);

    /* ----------------------------------
       Hydrate pet + client
    ---------------------------------- */
    useEffect(() => {
        if (petId == null) return; // ✅ guard real sobre el state

        const pid: number = petId; // ✅ aquí ya es number sí o sí

        let mounted = true;

        async function hydrate() {
            setHydrating(true);
            try {
                const pRes = await petsApi.getById(pid); // ✅ pid: number
                if (!mounted) return;

                const p = pRes.data ?? null;
                setPet(p);

                if (!p) {
                    setClient(null);
                    return;
                }

                const cRes = await clientsApi.getById(p.clientId);
                if (!mounted) return;

                setClient(cRes.data ?? null);
            } finally {
                if (mounted) setHydrating(false);
            }
        }

        hydrate();
        return () => {
            mounted = false;
        };
    }, [petId]);

    /* ----------------------------------
       Validations
    ---------------------------------- */
    const canSubmit = useMemo(() => {
        if (loading || saving) return false;
        if (!petId) return false;
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
            }
        }

        return true;
    }, [
        loading,
        saving,
        petId,
        visitedAt,
        items,
        paymentEnabled,
        paymentStatus,
        paymentMethod,
        amountPaid,
    ]);

    /* ----------------------------------
       Build payload (shape compatible con backend)
    ---------------------------------- */
    function buildPayload() {
        const visitedAtIso = visitedAt.length === 16 ? `${visitedAt}:00` : visitedAt;

        return {
            petId: petId!, // requerido
            appointmentId: appointmentId ?? null,
            visitedAt: visitedAtIso,
            notes: notes.trim() || null,
            items: items.map((it) => ({
                category: it.category,
                price: Number(it.price),
                detail:
                    it.category === "TREATMENT"
                        ? null
                        : it.detailMode === "TEXT"
                            ? it.detailText.trim()
                            : null,
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
                    method: paymentStatus === "PENDING" ? null : paymentMethod || null,
                    amountPaid: paymentStatus === "PARTIAL" ? Number(amountPaid) : null,
                },
        };
    }

    /* ----------------------------------
       Save
    ---------------------------------- */
    async function onSave() {
        if (!canSubmit) return;
        setSaving(true);

        try {
            await visitsApi.update(visitId, buildPayload());
            router.push(`/visits/${visitId}?from=${encodeURIComponent(backHref)}`);
        } catch (e) {
            errModal.show(e, "No se pudo guardar la atención");
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

    const temperamentTone = (pet?.temperament as PetTemperament | undefined) ?? undefined;
    const showAggressiveWarning = temperamentTone === "AGGRESSIVE";

    if (!Number.isFinite(visitId)) {
        return (
            <Card className="space-y-2">
                <h2 className="text-xl font-semibold">ID inválido</h2>
                <p className="text-sm text-[color:var(--muted)]">No se pudo abrir la atención (id incorrecto).</p>
                <Link href={backHref}>
                    <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
                        Volver
                    </Button>
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Editar atención #{visitId}</h2>
                    <p className="text-sm text-[color:var(--muted)]">
                        Actualiza fecha, items y pago.
                        {appointmentId ? ` Vinculada a cita #${appointmentId}.` : " Sin cita vinculada."}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href={backHref}>
                        <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
                            Volver
                        </Button>
                    </Link>

                    <Button variant="primary" icon={Save} type="button" onClick={onSave} disabled={!canSubmit}>
                        {saving ? "Guardando..." : "Guardar cambios"}
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

            {/* Mascota + Cliente (info) */}
            <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <PawPrint className="h-5 w-5" />
                        <div>
                            <div className="text-sm font-semibold">Mascota</div>
                            <div className="text-xs text-[color:var(--muted)]">
                                En edición no cambiamos mascota (por ahora).
                            </div>
                        </div>
                    </div>

                    {petId ? <Chip>Mascota #{petId}</Chip> : <Chip>—</Chip>}
                </div>

                {showAggressiveWarning && (
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-5 w-5" />
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">⚠ Mascota marcada como “Agresivo”</div>
                                <div className="mt-1 text-xs text-[color:var(--muted)]">
                                    Recomendación: manipulación con cuidado y deja notas claras.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Dog className="h-4 w-4" />
                            <div className="font-semibold">Mascota</div>
                        </div>
                        <div className="mt-2 text-[color:var(--muted)]">
                            {hydrating ? "Cargando..." : pet ? (
                                <>
                                    <div><span className="font-semibold">Nombre:</span> {pet.name}</div>
                                    <div><span className="font-semibold">Código:</span> {pet.code}</div>
                                    {pet.temperament && (
                                        <div>
                                            <span className="font-semibold">Temperamento:</span>{" "}
                                            {petTemperamentUI[pet.temperament as PetTemperament]?.label ?? String(pet.temperament)}
                                        </div>
                                    )}
                                </>
                            ) : "—"}
                        </div>

                        {pet?.id && (
                            <div className="mt-3">
                                <Link href={`/pets/${pet.id}/edit`}>
                                    <Button variant="primaryOutline" icon={Pencil} type="button">
                                        Editar mascota
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div className="font-semibold">Cliente</div>
                        </div>
                        <div className="mt-2 text-[color:var(--muted)]">
                            {hydrating ? "Cargando..." : client ? (
                                <>
                                    <div><span className="font-semibold">Nombre:</span> {client.firstName} {client.lastName}</div>
                                    <div><span className="font-semibold">Código:</span> {client.code}</div>
                                </>
                            ) : "—"}
                        </div>

                        {client?.id && (
                            <div className="mt-3">
                                <Link href={`/clients/${client.id}/edit`}>
                                    <Button variant="secondaryOutline" icon={Pencil} type="button">
                                        Editar cliente
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Datos de visita */}
            <Card className="space-y-4">
                {loading ? (
                    <div className="text-sm text-[color:var(--muted)]">Cargando atención...</div>
                ) : (
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
                        </div>
                    </div>
                )}
            </Card>

            {/* Items */}
            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        <div>
                            <div className="text-sm font-semibold">Servicios / Tratamientos</div>
                            <div className="text-xs text-[color:var(--muted)]">
                                Precio &gt; 0. Tratamiento requiere tipo y medicamento.
                            </div>
                        </div>
                    </div>

                    <Button variant="primaryOutline" icon={Plus} type="button" onClick={addItem} disabled={loading}>
                        Agregar item
                    </Button>
                </div>

                <div className="space-y-3">
                    {items.map((it, idx) => {
                        const isTreatment = it.category === "TREATMENT";

                        return (
                            <div key={it.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-semibold">Item #{idx + 1}</div>

                                    <Button
                                        variant="secondaryOutline"
                                        icon={Trash2}
                                        type="button"
                                        onClick={() => removeItem(it.id)}
                                        disabled={items.length === 1 || loading}
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
                                            disabled={loading}
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
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel>Detalle</FieldLabel>

                                        {isTreatment ? (
                                            <div className="mt-1 text-xs text-[color:var(--muted)]">
                                                Requiere tipo y medicamento (catálogos).
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant={it.detailMode === "NONE" ? "primaryOutline" : "secondaryOutline"}
                                                    onClick={() => updateItem(it.id, { detailMode: "NONE", detailText: "" })}
                                                    disabled={loading}
                                                >
                                                    Sin detalle
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={it.detailMode === "TEXT" ? "primaryOutline" : "secondaryOutline"}
                                                    onClick={() => updateItem(it.id, { detailMode: "TEXT" })}
                                                    disabled={loading}
                                                >
                                                    Con detalle
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {!isTreatment && it.detailMode === "TEXT" && (
                                        <div className="lg:col-span-3">
                                            <FieldLabel>Detalle del servicio</FieldLabel>
                                            <input
                                                value={it.detailText}
                                                onChange={(e) => updateItem(it.id, { detailText: e.target.value })}
                                                className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                                                placeholder="Ej: Pelo pegado / baño medicado / nudos / etc."
                                                disabled={loading}
                                            />
                                            {!it.detailText.trim() && (
                                                <Helper>Si eliges “Con detalle”, este campo es obligatorio.</Helper>
                                            )}
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
                                                            ? (treatmentTypes.items.find((x) => x.id === it.treatmentTypeId)?.name ?? it.treatmentTypeText)
                                                            : it.treatmentTypeText
                                                    }
                                                    onChange={(v) => updateItem(it.id, { treatmentTypeText: v, treatmentTypeId: null })}
                                                    onPick={(item) => updateItem(it.id, { treatmentTypeId: Number(item.id), treatmentTypeText: item.label })}
                                                    disabled={treatmentTypes.loading || loading}
                                                />
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
                                                    onChange={(v) => updateItem(it.id, { medicineText: v, medicineId: null })}
                                                    onPick={(item) => updateItem(it.id, { medicineId: Number(item.id), medicineText: item.label })}
                                                    disabled={medicines.loading || loading}
                                                />
                                            </div>

                                            <div className="lg:col-span-1">
                                                <FieldLabel>Próxima fecha (opcional)</FieldLabel>
                                                <input
                                                    type="date"
                                                    value={it.nextDate}
                                                    onChange={(e) => updateItem(it.id, { nextDate: e.target.value })}
                                                    className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                                                    disabled={loading}
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
                        disabled={loading}
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
                                    disabled={loading}
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
                                    disabled={paymentStatus === "PENDING" || loading}
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
                                        disabled={loading}
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
