"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Pencil, Save, X } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { ApiError } from "@/shared/http/apiError";

import { useZonesCatalog } from "@/features/catalogs/hooks/useCatalogs";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function ErrorBox({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
            <span className="font-semibold">Error:</span>{" "}
            <span className="text-[color:var(--muted)]">{message}</span>
        </div>
    );
}

export default function ZonesCatalogPage() {
    const zones = useZonesCatalog();

    /* =========================
       Crear / Buscar
       ========================= */
    const [value, setValue] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const autocompleteItems = useMemo(
        () =>
            zones.items.map((z) => ({
                id: z.id,
                label: z.name,
                subLabel: z.normalizedName,
            })),
        [zones.items]
    );

    async function onCreate() {
        const trimmed = value.trim();
        if (!trimmed) return;

        setCreating(true);
        setCreateError(null);

        try {
            await zones.create(trimmed);
            setValue("");
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                        ? err.message
                        : "No se pudo crear la zona";

            setCreateError(msg);
        } finally {
            setCreating(false);
        }
    }

    /* =========================
       Edit inline
       ========================= */
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    function startEdit(id: number, name: string) {
        setEditingId(id);
        setEditValue(name);
        setEditError(null);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditValue("");
        setEditError(null);
    }

    async function saveEdit() {
        if (editingId == null) return;
        const trimmed = editValue.trim();
        if (!trimmed) return;

        setSavingEdit(true);
        setEditError(null);

        try {
            await zones.update(editingId, trimmed);
            cancelEdit();
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                        ? err.message
                        : "No se pudo actualizar la zona";

            setEditError(msg);
        } finally {
            setSavingEdit(false);
        }
    }

    /* =========================
       Render
       ========================= */
    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
                        <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold">Zonas</h2>
                        <p className="text-sm text-[color:var(--muted)]">
                            Distritos o áreas asignadas a los clientes.
                        </p>
                    </div>
                </div>

                <Link href="/catalogs">
                    <Button
                        variant="secondaryOutline"
                        icon={ArrowLeft}
                        type="button"
                    >
                        Volver a catálogos
                    </Button>
                </Link>
            </Card>


            {/* Crear / Buscar */}
            <Card className="space-y-3">
                <AutocompleteInput
                    label="Buscar o crear zona"
                    placeholder="Ej: San Juan de Lurigancho"
                    items={autocompleteItems}
                    value={value}
                    onChange={setValue}
                    disabled={zones.loading}
                />

                <Button
                    variant="primary"
                    icon={Plus}
                    onClick={onCreate}
                    disabled={creating || !value.trim()}
                    type="button"
                >
                    {creating ? "Guardando..." : "Agregar nueva zona"}
                </Button>

                {(zones.error || createError) && (
                    <ErrorBox message={createError ?? zones.error!} />
                )}
            </Card>

            {/* Lista */}
            <Card className="space-y-3">
                <div className="text-sm font-semibold">Zonas registradas</div>

                {zones.loading ? (
                    <div className="text-sm text-[color:var(--muted)]">Cargando zonas...</div>
                ) : zones.items.length === 0 ? (
                    <div className="text-sm text-[color:var(--muted)]">
                        Aún no hay zonas registradas.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {zones.items.map((z) => {
                            const isEditing = editingId === z.id;

                            if (!isEditing) {
                                return (
                                    <div
                                        key={z.id}
                                        className="flex items-center justify-between gap-3 rounded-2xl
                               border border-[color:var(--border)] bg-[color:var(--surface)]
                               px-4 py-3 hover:shadow-sm transition-all"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold">{z.name}</div>
                                            <div className="text-xs text-[color:var(--muted)]">
                                                {z.normalizedName}
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            icon={Pencil}
                                            type="button"
                                            onClick={() => startEdit(z.id, z.name)}
                                        >
                                            Editar
                                        </Button>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={z.id}
                                    className="rounded-2xl border border-[color:var(--border)]
                             bg-[color:var(--surface)] p-4 space-y-3"
                                >
                                    <input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full rounded-xl border border-[color:var(--border)]
                               bg-[color:var(--surface)] px-3 py-2 text-sm outline-none"
                                        autoFocus
                                    />

                                    {editError && <ErrorBox message={editError} />}

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="primary"
                                            icon={Save}
                                            onClick={saveEdit}
                                            disabled={savingEdit || !editValue.trim()}
                                            type="button"
                                        >
                                            Guardar
                                        </Button>

                                        <Button
                                            variant="secondaryOutline"
                                            icon={X}
                                            onClick={cancelEdit}
                                            type="button"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
