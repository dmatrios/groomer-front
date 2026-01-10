"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { visitsApi, type VisitCreateRequest, type VisitDetailResponse } from "@/features/visits/api/visitsApi";

type State = {
  loading: boolean;
  error: string | null;
};

export function useVisitCreate() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
  });

  const create = useCallback(async (payload: VisitCreateRequest): Promise<VisitDetailResponse> => {
    setState({ loading: true, error: null });

    try {
      const res = await visitsApi.create(payload);
      setState({ loading: false, error: null });
      return res.data;
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo crear la visita";

      setState({ loading: false, error: msg });
      throw err; // clave: el page decide si abre modal, redirect, etc.
    }
  }, []);

  return {
    create,
    loading: state.loading,
    error: state.error,
  };
}
