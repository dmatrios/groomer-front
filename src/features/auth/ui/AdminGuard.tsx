"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENV } from "@/shared/config/env";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ENV.AUTH_REQUIRED) {
      setReady(true);
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.replace("/forbidden");
      return;
    }

    setReady(true);
  }, [router, isAuthenticated, user]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  return <>{children}</>;
}
