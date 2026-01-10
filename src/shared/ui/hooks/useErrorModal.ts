// src/shared/ui/hooks/useErrorModal.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError } from "@/shared/http/apiError";

export type ErrorState = {
  open: boolean;
  title: string;
  message: string;

  // ✅ extras para UX (no siempre existen)
  status?: number;
  code?: string;
  kind?: ApiError["kind"];
};

const initialState: ErrorState = {
  open: false,
  title: "Error",
  message: "Ocurrió un error.",
};

function extractMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Ocurrió un error inesperado.";
}

/**
 * Hook central para mostrar errores en modal:
 * - Soporta ApiError (status, kind, code)
 * - Fallback para Error genérico
 */
export function useErrorModal() {
  const [state, setState] = useState<ErrorState>(initialState);

  const close = useCallback(() => {
    setState(initialState);
  }, []);

  const show = useCallback((err: unknown, title?: string) => {
    // Defaults
    let status: number | undefined = undefined;
    let kind: ApiError["kind"] | undefined = undefined;
    let code: string | undefined = undefined;

    // Si es ApiError, enriquecemos el modal
    if (err instanceof ApiError) {
      status = err.status;
      kind = err.kind;

      // Intentamos extraer code del details (depende tu backend/errorMapper)
      // Soporta 2 formatos:
      // 1) ApiErrorResponse { code: "SOME_CODE", message: "..." }
      // 2) ApiResponse.error { error: { code: "...", message: "..." } } (si lo usas así)
      const d: any = err.details;

      if (d && typeof d === "object") {
        // ApiErrorResponse típico
        if (typeof d.code === "string") code = d.code;

        // Si tu backend manda { error: { code } }
        if (!code && d.error && typeof d.error.code === "string") code = d.error.code;
      }
    }

    setState({
      open: true,
      title: title ?? "Error",
      message: extractMessage(err),
      status,
      code,
      kind,
    });
  }, []);

  return useMemo(() => ({ state, show, close }), [state, show, close]);
}
