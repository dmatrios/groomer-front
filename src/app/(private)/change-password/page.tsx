"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { changePasswordApi } from "@/features/auth/api/authApi";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Modal } from "@/shared/ui/components/Modal";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refreshMe } = useAuth();
  const errModal = useErrorModal();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const forced = !!user?.mustChangePassword;

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (newPassword.length < 6) return false;
    if (newPassword !== confirm) return false;
    if (!forced && !currentPassword) return false;
    return true;
  }, [busy, newPassword, confirm, currentPassword, forced]);

  async function handleSubmit() {
    if (!canSubmit) return;

    try {
      setBusy(true);

      await changePasswordApi({
        newPassword,
        ...(forced ? {} : { currentPassword }),
      });

      // 🔁 refrescamos sesión para limpiar mustChangePassword
      await refreshMe();

      router.replace("/dashboard");
    } catch (err) {
      errModal.show(err, "No se pudo cambiar la contraseña");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            <Lock className="h-4 w-4 text-[color:var(--brand-indigo)]" />
          </span>

          <div>
            <h1 className="text-lg font-semibold">Cambiar contraseña</h1>
            <p className="text-sm text-[color:var(--muted)]">
              {forced
                ? "Debes cambiar tu contraseña antes de continuar."
                : "Actualiza tu contraseña cuando lo necesites."}
            </p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="space-y-3">
        {!forced && (
          <div>
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              Contraseña actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={busy}
              className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Nueva contraseña
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={busy}
            className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--brand-cyan)]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {!forced && (
            <Button
              variant="secondaryOutline"
              onClick={() => router.back()}
              disabled={busy}
            >
              Cancelar
            </Button>
          )}

          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Card>

      {/* Error modal */}
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
        {errModal.state.message}
      </Modal>
    </div>
  );
}
