// src/shared/http/errorMapper.ts

import { ApiError, ApiErrorKind } from "./apiError";

export function mapStatusToKind(status: number): ApiErrorKind {
  if (status === 400) return "VALIDATION";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "BUSINESS";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status >= 500) return "SERVER";
  return "UNKNOWN";
}

export async function buildApiError(params: {
  status: number;
  url: string;
  response: Response;
}): Promise<ApiError> {
  const { status, url, response } = params;

  let details: unknown = undefined;
  try {
    // Intentamos leer JSON (si el backend manda body)
    details = await response.clone().json();
  } catch {
    // Si no es JSON, no pasa nada
  }

  const kind = mapStatusToKind(status);

  // Mensajes “humanos” base (luego los refinamos por pantalla)
  const message =
    kind === "VALIDATION"
      ? "Revisa los datos ingresados."
      : kind === "NOT_FOUND"
      ? "No se encontró el recurso solicitado."
      : kind === "BUSINESS"
      ? "No se puede completar la operación por una regla del negocio."
      : kind === "UNAUTHORIZED"
      ? "Sesión no válida o expirada."
      : kind === "FORBIDDEN"
      ? "No tienes permisos para esta acción."
      : kind === "SERVER"
      ? "Error del servidor. Intenta nuevamente."
      : "Ocurrió un error inesperado.";

  return new ApiError({
    message: `${message} [HTTP ${status}]`,
    kind,
    status,
    details: details ?? { url },
  });
}
