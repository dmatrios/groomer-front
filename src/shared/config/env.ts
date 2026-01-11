// src/shared/config/env.ts

function readEnv(key: string): string | undefined {
  const v = process.env[key];
  const value = v?.trim();
  return value && value.length > 0 ? value : undefined;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * IMPORTANTE:
 * - En PROD: exigimos que existan (pero sin crashear al "import" en browser).
 * - En DEV: defaults claros.
 */
function getPublicEnv(key: string, devDefault?: string): string {
  const value = readEnv(key);

  // DEV: fallback cómodo
  if (!isProd) return value ?? (devDefault ?? "");

  // PROD: si falta, devolvemos "" (y lo validamos en runtime en el client)
  return value ?? "";
}

export const ENV = {
  API_BASE_URL: getPublicEnv(
    "NEXT_PUBLIC_API_BASE_URL",
    "http://localhost:8080/api/v1"
  ),

  STATIC_BASE_URL: getPublicEnv(
    "NEXT_PUBLIC_STATIC_BASE_URL",
    "http://localhost:8080"
  ),

  AUTH_REQUIRED: (readEnv("NEXT_PUBLIC_AUTH_REQUIRED") ?? "true") === "true",
} as const;

// ✅ Validación "fail fast" solo cuando estamos en server (build/SSR)
if (isProd && typeof window === "undefined") {
  if (!ENV.API_BASE_URL) throw new Error("[ENV] Falta NEXT_PUBLIC_API_BASE_URL en Production.");
  if (!ENV.STATIC_BASE_URL) throw new Error("[ENV] Falta NEXT_PUBLIC_STATIC_BASE_URL en Production.");
}
