"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { visitsApi, type VisitDetailResponse, type VisitItemCategory } from "@/features/visits/api/visitsApi";
import { ApiError } from "@/shared/http/apiError";

type Params = {
  petId: number;
  category?: VisitItemCategory | "ALL";
};

type State = {
  items: VisitDetailResponse[];
  loading: boolean;
  error: string | null;
};

export function usePetHistory({ petId, category = "ALL" }: Params) {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!Number.isFinite(petId) || petId <= 0) {
      setState({
        items: [],
        loading: false,
        error: "petId inválido",
      });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await visitsApi.listByPet(petId);

      let items = res.data ?? [];

      // ✅ filtro por categoría (frontend)
      if (category && category !== "ALL") {
        items = items.filter((v) =>
          v.items?.some((it) => it.category === category)
        );
      }

      setState({
        items,
        loading: false,
        error: null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando historial de atenciones";

      setState({
        items: [],
        loading: false,
        error: msg,
      });
    }
  }, [petId, category]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      items: state.items,
      loading: state.loading,
      error: state.error,
      refresh: load,
      hasItems: state.items.length > 0,
    }),
    [state.items, state.loading, state.error, load]
  );
}
