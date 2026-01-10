"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Scissors,
  CalendarDays,
  PawPrint,
  Users,
  Search,
  Settings,
  BarChart3,
  Sparkles,
  Shield,
  BadgeCheck,
  KeyRound,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/shared/ui/components/Button";
import { Card } from "@/shared/ui/components/Card";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  hint?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const baseNavSections: NavSection[] = [
  {
    title: "Operación",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        hint: "Resumen del día",
      },
      {
        href: "/visits",
        label: "Atenciones",
        icon: Scissors,
        hint: "Registrar y ver atenciones",
      },
      {
        href: "/appointments",
        label: "Citas",
        icon: CalendarDays,
        hint: "Agenda y estados",
      },
      {
        href: "/search",
        label: "Buscar",
        icon: Search,
        hint: "Cliente / mascota / teléfono",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        href: "/clients",
        label: "Clientes",
        icon: Users,
        hint: "Personas",
      },
      {
        href: "/pets",
        label: "Mascotas",
        icon: PawPrint,
        hint: "Mascotas por cliente",
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        href: "/catalogs",
        label: "Catálogos",
        icon: Settings,
        hint: "Zonas, tratamientos, medicinas",
      },
      {
        href: "/reports",
        label: "Reportes",
        icon: BarChart3,
        hint: "Ingresos y métricas",
      },
    ],
  },
];

function NavLinks({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted)]">
            {section.title}
          </div>

          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={[
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all",
                    "border border-transparent",
                    active
                      ? "bg-[color:var(--surface)] shadow-sm border-[color:var(--border)]"
                      : "text-[color:var(--text)] hover:bg-[color:var(--surface)] hover:shadow-sm hover:border-[color:var(--border)]",
                  ].join(" ")}
                >
                  {/* Barra lateral del activo */}
                  <span
                    className={[
                      "absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full transition-all",
                      active
                        ? "bg-[color:var(--primary)]"
                        : "bg-transparent group-hover:bg-[color:var(--border)]",
                    ].join(" ")}
                    aria-hidden
                  />

                  {/* Icono */}
                  <span
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                      active
                        ? "border-[color:var(--border)] bg-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] group-hover:bg-white",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4 w-4 transition-all",
                        active
                          ? "text-[color:var(--primary)]"
                          : "text-[color:var(--muted)] group-hover:text-[color:var(--text)]",
                      ].join(" ")}
                    />
                  </span>

                  {/* Texto */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{item.label}</div>
                    {item.hint && (
                      <div className="truncate text-[11px] font-medium text-[color:var(--muted)]">
                        {item.hint}
                      </div>
                    )}
                  </div>

                  {/* Flecha */}
                  <span
                    className={[
                      "text-xs opacity-0 transition-opacity group-hover:opacity-100",
                      active
                        ? "text-[color:var(--primary)]"
                        : "text-[color:var(--muted)]",
                    ].join(" ")}
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  onLogout,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  sections: NavSection[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute left-0 top-0 h-full w-[86%] max-w-[380px] bg-white">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">Menú</div>
              <div className="text-xs text-[color:var(--muted)]">Navegación</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 transition-all hover:shadow-sm"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* CTA principal dentro del drawer (mobile) */}
          <Link href="/visits/new" onClick={onClose}>
            <Button variant="primary" type="button" className="w-full">
              Registrar atención
            </Button>
          </Link>

          <Card className="p-3">
            <NavLinks sections={sections} onNavigate={onClose} />
          </Card>

          <div className="pt-2 border-t border-[color:var(--border)]">
            <Button
              variant="secondaryOutline"
              icon={LogOut}
              type="button"
              onClick={onLogout}
              className="w-full"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const mustChangePassword = !!user?.mustChangePassword;

  const navSections: NavSection[] = useMemo(() => {
    const sections: NavSection[] = [...baseNavSections];

    if (isAdmin) {
      sections.push({
        title: "Administración",
        items: [
          {
            href: "/users",
            label: "Usuarios",
            icon: Shield,
            hint: "Cuentas y accesos",
          },
        ],
      });
    }

    return sections;
  }, [isAdmin]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const today = useMemo(() => {
    return new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
        sections={navSections}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Hamburguesa (mobile) */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 transition-all hover:shadow-sm md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
              </span>

              <div>
                <div className="text-sm font-semibold leading-tight">Groomer</div>
                <div className="text-xs text-[color:var(--muted)] capitalize">
                  {today}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* user pill (UX pro) */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
                <BadgeCheck className="h-4 w-4 text-[color:var(--brand-green)]" />
                <div className="leading-tight">
                  <div className="text-xs font-semibold">{user.fullName}</div>
                  <div className="text-[11px] text-[color:var(--muted)]">
                    @{user.username} • {user.role}
                  </div>
                </div>
              </div>
            )}

            {/* CTA principal */}
            <Link href="/visits/new">
              <Button variant="primary" type="button">
                Registrar atención
              </Button>
            </Link>

            {/* Salir */}
            <Button
              variant="secondaryOutline"
              icon={LogOut}
              type="button"
              onClick={handleLogout}
            >
              Salir
            </Button>
          </div>
        </div>

        {/* banner mustChangePassword (UX clara) */}
        {mustChangePassword && (
          <div className="border-t border-[color:var(--border)] bg-[color:var(--brand-orange)]/10">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4 text-[color:var(--brand-orange)]" />
                <span className="font-semibold">
                  Debes cambiar tu contraseña para continuar con normalidad.
                </span>
              </div>

              <Link href="/change-password">
                <Button variant="secondaryOutline" type="button">
                  Cambiar ahora
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Layout */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[280px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden md:block">
          <Card className="p-3">
            <div className="mb-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="text-sm font-semibold">Menú</div>
              <div className="text-xs text-[color:var(--muted)]">
                Accesos del sistema
              </div>
            </div>

            <NavLinks sections={navSections} />

            <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
              Tip: Usa <span className="font-semibold">Buscar</span> para
              encontrar rápido cliente o mascota.
            </div>
          </Card>
        </aside>

        {/* Main */}
        <main className="rounded-2xl border border-[color:var(--border)] bg-white p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
