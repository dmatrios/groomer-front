"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { clientsApi, type ClientResponse } from "../api/clientsApi";
import type { ApiResponse } from "@/shared/http/types";

type State = {
  items: ClientResponse[];
  meta: ApiResponse<ClientResponse[]>["meta"];
  loading: boolean;
  error: string | null;

  page: number;
  size: number;
  sort: string;
  zoneId?: number;
};

export function useClientsList() {
  const [state, setState] = useState<State>({
    items: [],
    meta: null,
    loading: true,
    error: null,
    page: 0,
    size: 10,
    sort: "lastName",
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await clientsApi.list({
        page: state.page,
        size: state.size,
        sort: state.sort,
        zoneId: state.zoneId,
      });

      setState((s) => ({
        ...s,
        items: res.data ?? [],
        meta: res.meta ?? null,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando clientes";

      setState((s) => ({
        ...s,
        items: [],
        meta: null,
        loading: false,
        error: message,
      }));
    }
  }, [state.page, state.size, state.sort, state.zoneId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPage = useCallback((page: number) => setState((s) => ({ ...s, page })), []);
  const setSize = useCallback((size: number) => setState((s) => ({ ...s, size, page: 0 })), []);
  const setSort = useCallback((sort: string) => setState((s) => ({ ...s, sort, page: 0 })), []);
  const setZoneId = useCallback((zoneId?: number) => setState((s) => ({ ...s, zoneId, page: 0 })), []);

  return useMemo(
    () => ({
      ...state,
      refresh,
      setPage,
      setSize,
      setSort,
      setZoneId,
    }),
    [state, refresh, setPage, setSize, setSort, setZoneId]
  );
}
