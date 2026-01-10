"use client";

import { Modal } from "@/shared/ui/components/Modal";
import type { UserResponse } from "@/features/users/api/usersApi";

type Props = {
  open: boolean;
  user: UserResponse | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<{ ok: boolean }>;
};

export function DeactivateUserModal({
  open,
  user,
  busy,
  onClose,
  onConfirm,
}: Props) {
  async function handleConfirm() {
    if (!user || busy) return;
    const res = await onConfirm(user.id);
    if (res.ok) onClose();
  }

  return (
    <Modal
      open={open}
      title="Desactivar usuario"
      description="El usuario ya no podrá iniciar sesión."
      primaryText={busy ? "Desactivando..." : "Desactivar"}
      secondaryText="Cancelar"
      onPrimary={handleConfirm}
      onClose={onClose}
      busy={busy}
    >
      <div className="space-y-2">
        <div className="text-sm">
          ¿Seguro que deseas desactivar a{" "}
          <span className="font-semibold">{user?.fullName}</span> (
          <span className="font-semibold">{user?.username}</span>)?
        </div>

        <div className="text-xs text-[color:var(--muted)]">
          Esta acción es reversible solo si implementas “activar” luego.
        </div>
      </div>
    </Modal>
  );
}
