"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { visitsApi, type VisitDetailResponse } from "@/features/visits/api/visitsApi";
import { ApiError } from "@/shared/http/apiError";

type Params = {
  from: Date;
  to: Date;
  petId?: number;
};

type State = {
  items: VisitDetailResponse[];
  loading: boolean;
  error: string | null;
};

function toIsoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export function useVisitsRange(params: Params) {
  const { from, to, petId } = params;

  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // si viene petId, backend ignora from/to y lista historial por mascota
      const res =
        petId != null
          ? await visitsApi.listByPet(petId)
          : await visitsApi.listByRange(toIsoLocal(from), toIsoLocal(to));

      setState({ items: res.data ?? [], loading: false, error: null });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando atenciones";

      setState({ items: [], loading: false, error: msg });
    }
  }, [from, to, petId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      items: state.items,
      loading: state.loading,
      error: state.error,
      refresh,
    }),
    [state.items, state.loading, state.error, refresh]
  );
}
