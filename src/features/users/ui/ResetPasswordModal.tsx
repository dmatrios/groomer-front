"use client";

import { useMemo, useState } from "react";
import { Copy, KeyRound } from "lucide-react";

import { Modal } from "@/shared/ui/components/Modal";
import { Button } from "@/shared/ui/components/Button";

import type { UserResponse } from "@/features/users/api/usersApi";

type Props = {
  open: boolean;
  user: UserResponse | null;
  busy?: boolean;

  onClose: () => void;
  onReset: (id: number) => Promise<{ ok: boolean; tempPassword?: string; error?: unknown }>;
};

export function ResetPasswordModal({ open, user, busy, onClose, onReset }: Props) {
  const [step, setStep] = useState<"confirm" | "result">("confirm");
  const [tempPassword, setTempPassword] = useState<string>("");

  const canAct = useMemo(() => !!user && !busy, [user, busy]);

  async function handlePrimary() {
    if (!user) return;

    if (step === "confirm") {
      const res = await onReset(user.id);
      if (res.ok && res.tempPassword) {
        setTempPassword(res.tempPassword);
        setStep("result");
      }
      return;
    }

    // step=result
    onClose();
    setStep("confirm");
    setTempPassword("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(tempPassword);
    } catch {
      // si falla, no pasa nada; el usuario puede copiar manualmente
    }
  }

  return (
    <Modal
      open={open}
      title={step === "confirm" ? "Resetear contraseña" : "Clave temporal generada"}
      description={
        step === "confirm"
          ? "Se generará una clave temporal. El usuario deberá cambiarla al iniciar sesión."
          : "Cópiala y envíala al usuario. Esta clave solo se muestra una vez."
      }
      onClose={() => {
        onClose();
        setStep("confirm");
        setTempPassword("");
      }}
      secondaryText={step === "confirm" ? "Cancelar" : "Cerrar"}
      primaryText={step === "confirm" ? "Generar clave" : "Listo"}
      onPrimary={canAct ? handlePrimary : undefined}
      busy={busy}
    >
      {step === "confirm" ? (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <KeyRound className="h-5 w-5 text-[color:var(--brand-indigo)]" />
            </span>

            <div className="min-w-0">
              <div className="text-sm font-semibold">
                Usuario: <span className="font-bold">{user?.fullName}</span>
              </div>
              <div className="text-xs text-[color:var(--muted)]">@{user?.username}</div>

              {!user?.active && (
                <div className="mt-2 text-xs text-[color:var(--brand-orange)]">
                  Nota: el usuario está inactivo. Si tu backend bloquea el reset en inactivos, actívalo primero.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-[color:var(--muted)]">
            Clave temporal (copiar y enviar):
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
            <div className="flex-1 font-mono text-sm font-semibold tracking-wide">
              {tempPassword}
            </div>

            <Button
              type="button"
              variant="secondaryOutline"
              icon={Copy}
              onClick={copy}
              disabled={!tempPassword}
            >
              Copiar
            </Button>
          </div>

          <div className="text-xs text-[color:var(--muted)]">
            Recomendación: después del login, el sistema debe forzar “Cambiar contraseña”.
          </div>
        </div> 
      )}
    </Modal>
  );
}
