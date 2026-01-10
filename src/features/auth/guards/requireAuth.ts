import { ENV } from "@/shared/config/env";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";

export function requireAuth(): { allowed: boolean } {
  // Feature flag: si auth está desactivado, no bloqueamos
  if (!ENV.AUTH_REQUIRED) return { allowed: true };

  // Si auth está activado, requerimos token
  const token = tokenStorage.getToken();
  return { allowed: Boolean(token) };
}
