"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";

import { loginApi } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { Modal } from "@/shared/ui/components/Modal";
import { useErrorModal } from "@/shared/ui/hooks/useErrorModal";

function normalizeUsername(v: string) {
  return v.trim();
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const { login } = useAuth();
  const errModal = useErrorModal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return normalizeUsername(username).length > 0 && password.length > 0 && !loading;
  }, [username, password, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const res = await loginApi({
        username: normalizeUsername(username),
        password,
      });

      const { accessToken, user } = res.data;

      // ✅ sesión real (persist + contexto)
      login({ token: accessToken, user });

      // ✅ regla de negocio UX: si debe cambiar password, lo mandamos directo
      if (user.mustChangePassword) {
        router.replace("/change-password");
        return;
      }

      router.replace(next);
    } catch (err) {
      errModal.show(err, "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[color:var(--bg)] p-6">
      <Card className="w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[color:var(--brand-indigo)]">
            Groomer App
          </div>
          <h1 className="text-xl font-semibold text-[color:var(--text)]">
            Iniciar sesión
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            Ingresa con tu usuario y contraseña.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              Usuario
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
                <UserIcon className="h-4 w-4" />
              </span>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                placeholder="Ej: admin"
                autoComplete="username"
                className={[
                  "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]",
                  "pl-9 pr-3 py-2 text-sm outline-none transition-all duration-200",
                  "text-[color:var(--text)]",
                  "focus:ring-2 focus:ring-[color:var(--brand-cyan)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[color:var(--muted)]">
              Contraseña
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
                <Lock className="h-4 w-4" />
              </span>

              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="current-password"
                className={[
                  "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]",
                  "pl-9 pr-10 py-2 text-sm outline-none transition-all duration-200",
                  "text-[color:var(--text)]",
                  "focus:ring-2 focus:ring-[color:var(--brand-cyan)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[color:var(--muted)] transition-all duration-200 hover:brightness-110 hover:shadow-sm disabled:hover:shadow-none"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>

          {/* Footer hint */}
          <div className="text-xs text-[color:var(--muted)]">
            Si no tienes acceso, pídele al administrador que cree tu usuario o te
            genere una clave temporal.
          </div>
        </form>
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
    </main>
  );
}
