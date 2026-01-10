import { assetUrl } from "@/shared/config/asset";

export function petImageSrc(urlOrFilename?: string | null) {
  return assetUrl(urlOrFilename ?? null);
}
