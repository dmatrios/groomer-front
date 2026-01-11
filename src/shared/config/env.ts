// src/shared/config/env.ts

function readEnv(key: string): string | undefined {
  const v = process.env[key];
  const value = v?.trim();
  return value && value.length > 0 ? value : undefined;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * Env pública (NEXT_PUBLIC_*)
 * - DEV: usa default (para evitar fricción local)
 * - PROD: OBLIGATORIA (si falta, revienta con error claro)
 *
 * Motivo:
 * Si en PROD falta, el front termina pegando a rutas relativas (tu dominio Vercel),
 * y salen errores tipo 405/404 difíciles de rastrear.
 */
function requirePublicEnv(key: string, devDefault?: string): string {
  const value = readEnv(key);

  if (!isProd) return value ?? (devDefault ?? "");

  if (!value) {
    throw new Error(
      `[ENV] Falta la variable ${key} en Production (Vercel).`
    );
  }

  return value;
}

export const ENV = {
  API_BASE_URL: requirePublicEnv(
    "NEXT_PUBLIC_API_BASE_URL",
    "http://localhost:8080/api/v1"
  ),

  STATIC_BASE_URL: requirePublicEnv(
    "NEXT_PUBLIC_STATIC_BASE_URL",
    "http://localhost:8080"
  ),

  AUTH_REQUIRED: (readEnv("NEXT_PUBLIC_AUTH_REQUIRED") ?? "true") === "true",
} as const;
