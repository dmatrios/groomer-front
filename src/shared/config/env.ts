// src/shared/config/env.ts

function readEnv(key: string): string | undefined {
  const v = process.env[key];
  const value = v?.trim();
  return value && value.length > 0 ? value : undefined;
}

function requireEnv(key: string): string {
  const value = readEnv(key);
  if (!value) {
    throw new Error(`[ENV] Falta la variable ${key}. Configúrala en Vercel (Production).`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const ENV = {
  API_BASE_URL: isProd
    ? requireEnv("NEXT_PUBLIC_API_BASE_URL")
    : readEnv("NEXT_PUBLIC_API_BASE_URL") ?? "http://localhost:8080/api/v1",

  STATIC_BASE_URL: isProd
    ? requireEnv("NEXT_PUBLIC_STATIC_BASE_URL")
    : readEnv("NEXT_PUBLIC_STATIC_BASE_URL") ?? "http://localhost:8080",

  AUTH_REQUIRED: (readEnv("NEXT_PUBLIC_AUTH_REQUIRED") ?? "true") === "true",
} as const;
