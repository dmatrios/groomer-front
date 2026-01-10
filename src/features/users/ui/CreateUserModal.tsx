"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/shared/ui/components/Modal";
import { Button } from "@/shared/ui/components/Button";
import type { CreateUserRequest, UserRole } from "@/features/users/api/usersApi";

type Props = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onCreate: (req: CreateUserRequest) => Promise<{ ok: boolean }>;
};

export function CreateUserModal({ open, busy, onClose, onCreate }: Props) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  const canSubmit = useMemo(() => {
    return username.trim() && fullName.trim() && password.trim();
  }, [username, fullName, password]);

  async function handleCreate() {
    if (!canSubmit || busy) return;

    const res = await onCreate({
      username: username.trim(),
      fullName: fullName.trim(),
      password,
      role,
      forcePasswordChange,
    });

    if (res.ok) {
      // Reset limpio
      setUsername("");
      setFullName("");
      setPassword("");
      setRole("USER");
      setForcePasswordChange(true);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      title="Crear usuario"
      description="Crea una cuenta con rol y contraseña inicial."
      primaryText={busy ? "Creando..." : "Crear"}
      secondaryText="Cancelar"
      onPrimary={handleCreate}
      onClose={onClose}
      busy={busy}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Username
          </label>
          <input
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: admin"
            disabled={busy}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Nombre completo
          </label>
          <input
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="ej: María López"
            disabled={busy}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Contraseña
          </label>
          <input
            type="password"
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            disabled={busy}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              Rol
            </label>
            <select
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={busy}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              Seguridad
            </label>

            <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
              <div className="text-sm">Forzar cambio</div>
              <input
                type="checkbox"
                checked={forcePasswordChange}
                onChange={(e) => setForcePasswordChange(e.target.checked)}
                disabled={busy}
              />
            </div>
          </div>
        </div>

        {!canSubmit && (
          <div className="text-xs text-[color:var(--muted)]">
            Completa username, nombre y contraseña.
          </div>
        )}

        {/* Hint UX */}
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
          Tip: si “Forzar cambio” está activo, el usuario deberá cambiar su contraseña al ingresar.
        </div>

        {/* Botón extra opcional (si quieres) */}
        <div className="hidden">
          <Button variant="ghost" type="button">
            Extra
          </Button>
        </div>
      </div>
    </Modal>
  );
}
