// src/shared/config/asset.ts

import { ENV } from "@/shared/config/env";

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const base = ENV.STATIC_BASE_URL.replace(/\/+$/, ""); // quita slash final
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
