"use client";

import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";
import type { UserResponse } from "@/features/users/api/usersApi";

type Props = {
  items: UserResponse[];
  loading?: boolean;

  busyUserId?: number | null;
  busy?: boolean;

  onDeactivate: (u: UserResponse) => void;
  onActivate: (u: UserResponse) => void;
  onResetPassword: (u: UserResponse) => void;
};

export function UsersTable({
  items,
  loading,
  busyUserId,
  busy,
  onDeactivate,
  onActivate,
  onResetPassword,
}: Props) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] p-3">
        <div>
          <div className="text-sm font-semibold">Usuarios</div>
          <div className="text-xs text-[color:var(--muted)]">
            Crea cuentas, activa/desactiva accesos y genera claves temporales.
          </div>
        </div>

        <div className="text-xs text-[color:var(--muted)]">
          {loading ? "Cargando..." : `${items.length} total`}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--surface)]">
            <tr className="text-left">
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Username</th>
              <th className="p-3 font-semibold">Rol</th>
              <th className="p-3 font-semibold">Estado</th>
              <th className="p-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[color:var(--border)]">
                    <td className="p-3">
                      <div className="h-4 w-40 rounded bg-[color:var(--border)]/40" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-28 rounded bg-[color:var(--border)]/40" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-16 rounded bg-[color:var(--border)]/40" />
                    </td>
                    <td className="p-3">
                      <div className="h-6 w-20 rounded-full bg-[color:var(--border)]/40" />
                    </td>
                    <td className="p-3">
                      <div className="ml-auto h-9 w-56 rounded-xl bg-[color:var(--border)]/40" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {!loading &&
              items.map((u) => {
                const rowBusy = !!busy && busyUserId === u.id;

                return (
                  <tr key={u.id} className="border-t border-[color:var(--border)]">
                    <td className="p-3">
                      <div className="font-semibold">{u.fullName}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        ID: {u.id}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-[color:var(--muted)]">@{u.username}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold">{u.role}</div>
                    </td>

                    <td className="p-3">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                          u.active
                            ? "border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/15 text-[color:var(--brand-green)]"
                            : "border-[color:var(--brand-orange)]/30 bg-[color:var(--brand-orange)]/15 text-[color:var(--brand-orange)]",
                        ].join(" ")}
                      >
                        {u.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondaryOutline"
                          icon={KeyRound}
                          onClick={() => onResetPassword(u)}
                          disabled={rowBusy || loading}
                        >
                          {rowBusy ? "Procesando..." : "Reset clave"}
                        </Button>

                        {u.active ? (
                          <Button
                            type="button"
                            variant="danger"
                            icon={ShieldOff}
                            onClick={() => onDeactivate(u)}
                            disabled={rowBusy || loading}
                          >
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primaryOutline"
                            icon={ShieldCheck}
                            onClick={() => onActivate(u)}
                            disabled={rowBusy || loading}
                          >
                            Activar
                          </Button>
                        )}
                      </div>

                      <div className="mt-2 text-right text-[11px] text-[color:var(--muted)]">
                        Reset genera clave temporal (se muestra una sola vez).
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[color:var(--muted)]">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
