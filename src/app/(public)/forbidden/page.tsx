"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function ForbiddenPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[color:var(--bg)] p-6 text-[color:var(--text)]">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            <ShieldAlert className="h-5 w-5 text-[color:var(--brand-orange)]" />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Acceso restringido</h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              No tienes permisos para ver esta sección.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm">
          <div className="text-[color:var(--text)] font-semibold">¿Qué puedes hacer?</div>
          <ul className="mt-2 space-y-1 text-[color:var(--muted)]">
            <li>• Si crees que es un error, pide acceso a un administrador.</li>
            <li>• Si tu sesión expiró, vuelve a iniciar sesión.</li>
          </ul>

          {isAuthenticated && user?.role && (
            <div className="mt-3 text-xs text-[color:var(--muted)]">
              Sesión activa como:{" "}
              <span className="font-semibold text-[color:var(--text)]">
                {user.fullName}
              </span>{" "}
              ({user.role})
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondaryOutline" icon={ArrowLeft} className="w-full">
              Inicio
            </Button>
          </Link>

          {isAuthenticated ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" icon={LayoutDashboard} className="w-full">
                Volver al dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" icon={LogIn} className="w-full">
                Ir a login
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </main>
  );
}
