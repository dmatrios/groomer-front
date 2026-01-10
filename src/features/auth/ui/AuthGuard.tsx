"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ENV } from "@/shared/config/env";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ENV.AUTH_REQUIRED) {
      setReady(true);
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setReady(true);
  }, [router, pathname, isAuthenticated]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  }

  return <>{children}</>;
}
