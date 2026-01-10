"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { visitsApi, type VisitDetailResponse } from "@/features/visits/api/visitsApi";

type State = {
  item: VisitDetailResponse | null;
  loading: boolean;
  error: string | null;
};

export function useVisitDetail(id: number | null) {
  const [state, setState] = useState<State>({
    item: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!id) {
      setState({ item: null, loading: false, error: "id inválido" });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await visitsApi.getById(id);
      setState({ item: res.data, loading: false, error: null });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando la visita";

      setState({ item: null, loading: false, error: msg });
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    item: state.item,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
