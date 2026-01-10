"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Pill, Plus, Pencil, Save, X } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { AutocompleteInput } from "@/shared/ui/components/AutocompleteInput";
import { ApiError } from "@/shared/http/apiError";

import { useMedicinesCatalog } from "@/features/catalogs/hooks/useCatalogs";

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
      <span className="font-semibold">Error:</span>{" "}
      <span className="text-[color:var(--muted)]">{message}</span>
    </div>
  );
}

export default function MedicinesCatalogPage() {
  const med = useMedicinesCatalog();

  /* =========================
     Crear / Buscar
     ========================= */
  const [value, setValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const autocompleteItems = useMemo(
    () =>
      med.items.map((m) => ({
        id: m.id,
        label: m.name,
        subLabel: m.normalizedName,
      })),
    [med.items]
  );

  async function onCreate() {
    const trimmed = value.trim();
    if (!trimmed) return;

    setCreating(true);
    setCreateError(null);

    try {
      await med.create(trimmed);
      setValue("");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo crear la medicina";

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
      await med.update(editingId, trimmed);
      cancelEdit();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo actualizar la medicina";

      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            <Pill className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Medicinas</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Medicinas asociadas a tratamientos en las atenciones.
            </p>
          </div>
        </div>

        <Link href="/catalogs">
          <Button variant="secondaryOutline" icon={ArrowLeft} type="button">
            Volver a catálogos
          </Button>
        </Link>
      </Card>

      {/* Crear / Buscar */}
      <Card className="space-y-3">
        <AutocompleteInput
          label="Buscar o crear medicina"
          placeholder="Ej: Simparica"
          items={autocompleteItems}
          value={value}
          onChange={setValue}
          disabled={med.loading}
        />

        <Button
          variant="primary"
          icon={Plus}
          onClick={onCreate}
          disabled={creating || !value.trim()}
          type="button"
        >
          {creating ? "Guardando..." : "Agregar nueva medicina"}
        </Button>

        {(med.error || createError) && (
          <ErrorBox message={createError ?? med.error!} />
        )}
      </Card>

      {/* Lista */}
      <Card className="space-y-3">
        <div className="text-sm font-semibold">Medicinas registradas</div>

        {med.loading ? (
          <div className="text-sm text-[color:var(--muted)]">
            Cargando medicinas...
          </div>
        ) : med.items.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)]">
            Aún no hay medicinas registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {med.items.map((m) => {
              const isEditing = editingId === m.id;

              if (!isEditing) {
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3
                               rounded-2xl border border-[color:var(--border)]
                               bg-[color:var(--surface)] px-4 py-3
                               transition-all hover:shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {m.normalizedName}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      icon={Pencil}
                      type="button"
                      onClick={() => startEdit(m.id, m.name)}
                    >
                      Editar
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
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
