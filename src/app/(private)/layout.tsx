"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/shared/ui/layouts/AppShell";
import { useAuth } from "@/features/auth/hooks/useAuth";

function encodeNext(pathname: string) {
  return encodeURIComponent(pathname || "/dashboard");
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, refreshMe } = useAuth();

  const next = useMemo(() => encodeNext(pathname), [pathname]);

  useEffect(() => {
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=${next}`);
      return;
    }

    if (user?.mustChangePassword && pathname !== "/change-password") {
      router.replace("/change-password");
    }
  }, [isAuthenticated, user, pathname, router, next]);

  if (!isAuthenticated) return null;

  return <AppShell>{children}</AppShell>;
}
