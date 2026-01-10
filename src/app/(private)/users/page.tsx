"use client";

import { useEffect, useMemo, useState } from "react";
import { Users as UsersIcon } from "lucide-react";

import { Button } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";
import { Modal } from "@/shared/ui/components/Modal";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";

import { useUsers } from "@/features/users/hooks/useUsers";
import { UsersTable } from "@/features/users/ui/UsersTable";
import { CreateUserModal } from "@/features/users/ui/CreateUserModal";
import { DeactivateUserModal } from "@/features/users/ui/DeactivateUserModal";
import { ResetPasswordModal } from "@/features/users/ui/ResetPasswordModal";

import {
  AutocompleteInput,
  type AutocompleteItem,
} from "@/shared/ui/components/AutocompleteInput";

import type { UserResponse } from "@/features/users/api/usersApi";

export default function UsersPage() {
  const { items, loadingList, error, busyUserId, isBusy, create, deactivate, activate, resetPassword } = useUsers();
  const errModal = useErrorModal();

  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedDeactivate, setSelectedDeactivate] = useState<UserResponse | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [selectedReset, setSelectedReset] = useState<UserResponse | null>(null);

  // errores -> modal
  useEffect(() => {
    if (error) errModal.show(error, "Error cargando usuarios");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const autocompleteItems: AutocompleteItem[] = useMemo(() => {
    return items.map((u) => ({
      id: u.id,
      label: u.fullName,
      subLabel: u.username,
    }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }, [items, query]);

  async function handleCreate(req: any) {
    const res = await create(req);
    if (!res.ok) errModal.show(res.error, "No se pudo crear el usuario");
    return res;
  }

  async function handleDeactivate(id: number) {
    const res = await deactivate(id);
    if (!res.ok) errModal.show(res.error, "No se pudo desactivar el usuario");
    return res;
  }

  async function handleActivate(id: number) {
    const res = await activate(id);
    if (!res.ok) errModal.show(res.error, "No se pudo activar el usuario");
    return res;
  }

  async function handleResetPassword(id: number) {
    const res = await resetPassword(id);
    if (!res.ok) {
      errModal.show(res.error, "No se pudo resetear la contraseña");
      return { ok: false as const };
    }
    return { ok: true as const, tempPassword: res.data.temporaryPassword };
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-[color:var(--brand-indigo)]" />
            <h1 className="text-lg font-semibold">Gestión de usuarios</h1>
          </div>

          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Solo administradores. Aquí controlas accesos y seguridad del sistema.
          </p>

          <div className="mt-2 text-xs text-[color:var(--muted)]">
            Tip: si alguien olvidó su clave, usa <span className="font-semibold">Reset clave</span> para generar una temporal.
          </div>
        </div>

        <Button onClick={() => setCreateOpen(true)} disabled={loadingList || isBusy}>
          Nuevo usuario
        </Button>
      </Card>

      {/* Search */}
      <Card>
        <AutocompleteInput
          label="Buscar por nombre o username"
          placeholder="Escribe para filtrar..."
          items={autocompleteItems}
          value={query}
          onChange={setQuery}
          onPick={(it) => setQuery(it.subLabel ?? it.label)}
          disabled={loadingList}
        />
      </Card>

      {/* Table */}
      <UsersTable
        items={filtered}
        loading={loadingList}
        busy={isBusy}
        busyUserId={busyUserId}
        onDeactivate={(u) => {
          setSelectedDeactivate(u);
          setDeactivateOpen(true);
        }}
        onActivate={(u) => {
          void handleActivate(u.id);
        }}
        onResetPassword={(u) => {
          setSelectedReset(u);
          setResetOpen(true);
        }}
      />

      {/* Create */}
      <CreateUserModal
        open={createOpen}
        busy={isBusy}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      {/* Deactivate */}
      <DeactivateUserModal
        open={deactivateOpen}
        user={selectedDeactivate}
        busy={isBusy}
        onClose={() => {
          setDeactivateOpen(false);
          setSelectedDeactivate(null);
        }}
        onConfirm={handleDeactivate}
      />

      {/* Reset Password (tu UX top) */}
      <ResetPasswordModal
        open={resetOpen}
        user={selectedReset}
        busy={isBusy}
        onClose={() => {
          setResetOpen(false);
          setSelectedReset(null);
        }}
        onReset={handleResetPassword}
      />

      {/* Error Modal */}
      <Modal
        open={errModal.state.open}
        title={errModal.state.title}
        description={
          errModal.state.status
            ? `HTTP ${errModal.state.status}${
                errModal.state.code ? ` • ${errModal.state.code}` : ""
              }`
            : undefined
        }
        onClose={errModal.close}
        secondaryText="Cerrar"
      >
        <div>{errModal.state.message}</div>
      </Modal>
    </div>
  );
}
