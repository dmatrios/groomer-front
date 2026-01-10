// src/shared/auth/requireAuth.ts

import { ENV } from "@/shared/config/env";
import { authStore } from "./authStore";

export function requireAuth(): { allowed: boolean } {
  // Hoy: por defecto NO bloqueamos (AUTH_REQUIRED=false)
  if (!ENV.AUTH_REQUIRED) return { allowed: true };

  // Mañana: cuando active AUTH_REQUIRED, esto ya empieza a proteger
  const { isAuthenticated } = authStore.getState();
  return { allowed: isAuthenticated };
}
