// src/shared/config/env.ts

const isProd = process.env.NODE_ENV === "production";

// ✅ Acceso ESTÁTICO (Next sí lo inyecta en el bundle)
const API_BASE_URL_RAW = process.env.NEXT_PUBLIC_API_BASE_URL;
const STATIC_BASE_URL_RAW = process.env.NEXT_PUBLIC_STATIC_BASE_URL;
const AUTH_REQUIRED_RAW = process.env.NEXT_PUBLIC_AUTH_REQUIRED;

function normalize(v: string | undefined): string | undefined {
  const value = v?.trim();
  return value && value.length > 0 ? value : undefined;
}

const API_BASE_URL_DEV_DEFAULT = "http://localhost:8080/api/v1";
const STATIC_BASE_URL_DEV_DEFAULT = "http://localhost:8080";

const API_BASE_URL = normalize(API_BASE_URL_RAW) ?? (isProd ? "" : API_BASE_URL_DEV_DEFAULT);
const STATIC_BASE_URL = normalize(STATIC_BASE_URL_RAW) ?? (isProd ? "" : STATIC_BASE_URL_DEV_DEFAULT);

if (isProd) {
  // ✅ En PROD sí exigimos env vars (y ahora sí funcionará)
  if (!API_BASE_URL) throw new Error("[ENV] Falta la variable NEXT_PUBLIC_API_BASE_URL en Production (Vercel).");
  if (!STATIC_BASE_URL) throw new Error("[ENV] Falta la variable NEXT_PUBLIC_STATIC_BASE_URL en Production (Vercel).");
}

export const ENV = {
  API_BASE_URL,
  STATIC_BASE_URL,
  AUTH_REQUIRED: (normalize(AUTH_REQUIRED_RAW) ?? "true") === "true",
} as const;
