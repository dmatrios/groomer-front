// src/shared/http/httpClient.ts

import { ENV } from "@/shared/config/env";
import { ApiError } from "./apiError";
import { buildApiError } from "./errorMapper";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import { emitUnauthorized } from "@/features/auth/lib/authEvents";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Body permitido:
 * - JSON (object / array / primitive)
 * - FormData (para uploads multipart)
 * - null/undefined
 */
type HttpBody = unknown | FormData | null | undefined;

export type HttpClientOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: HttpBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string | null;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isFormData(body: HttpBody): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildRequestBody(body: HttpBody): BodyInit | null | undefined {
  if (body === undefined) return undefined;
  if (body === null) return null;

  // multipart
  if (isFormData(body)) return body;

  // JSON
  return JSON.stringify(body) as BodyInit;
}

export async function httpRequest<T>(
  path: string,
  options: HttpClientOptions = {}
): Promise<T> {
  const url = `${ENV.API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  const body = options.body;
  const hasBody = body !== undefined;
  const bodyIsFormData = isFormData(body);

  // ✅ Content-Type SOLO para JSON (NO FormData)
  if (hasBody && !bodyIsFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // 🔐 Token handling
  const token = options.token ?? tokenStorage.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: buildRequestBody(body),
      signal: options.signal ?? controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        tokenStorage.clearAll();
        emitUnauthorized();
      }

      throw await buildApiError({
        status: response.status,
        url,
        response,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await parseJsonSafe(response)) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;

    const isAbort = err instanceof Error && err.name === "AbortError";

    throw new ApiError({
      message: isAbort
        ? "La solicitud tardó demasiado (timeout)."
        : "No se pudo conectar con el servidor.",
      kind: "NETWORK",
      details: err,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const http = httpRequest;
