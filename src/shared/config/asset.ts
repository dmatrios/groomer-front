import { ENV } from "@/shared/config/env";

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${ENV.STATIC_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
