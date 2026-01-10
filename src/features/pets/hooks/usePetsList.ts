"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";

type State = {
  items: PetResponse[];
  loading: boolean;
  error: string | null;
};

type Params = {
  clientId?: number;
};

export function usePetsList(params: Params = {}) {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  // Filtros UI (local)
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30); // default para grid/list
  const [clientId, setClientId] = useState<number | undefined>(params.clientId);

  // Cache de detalles (para mainPhotoUrl) y evitar re-fetch
  const detailsCacheRef = useRef<Map<number, PetResponse>>(new Map());

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await petsApi.list(clientId);
      const raw = res.data ?? [];

      setState({
        items: raw,
        loading: false,
        error: null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando mascotas";

      setState({ items: [], loading: false, error: msg });
    }
  }, [clientId]);

  // Reset page al cambiar filtros
  useEffect(() => {
    setPage(0);
  }, [clientId, query, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.items;

    return state.items.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const code = (p.code ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [state.items, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = safePage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  // Enriquecer SOLO los visibles: trae mainPhotoUrl real con GET /pets/{id}
  const hydrateVisible = useCallback(async () => {
    const visibleIds = pageItems.map((p) => p.id);

    const missing = visibleIds.filter((id) => !detailsCacheRef.current.has(id));
    if (missing.length === 0) return;

    try {
      const results = await Promise.allSettled(missing.map((id) => petsApi.getById(id)));
      results.forEach((r, idx) => {
        const id = missing[idx];
        if (r.status === "fulfilled") {
          detailsCacheRef.current.set(id, r.value.data);
        }
      });
    } catch {
      // Si falla, no rompemos UI; solo se queda sin miniatura
    }
  }, [pageItems]);

  useEffect(() => {
    if (!state.loading) hydrateVisible();
  }, [state.loading, hydrateVisible]);

  const pageItemsHydrated = useMemo(() => {
    return pageItems.map((p) => detailsCacheRef.current.get(p.id) ?? p);
  }, [pageItems]);

  return useMemo(
    () => ({
      items: pageItemsHydrated,
      loading: state.loading,
      error: state.error,

      // filtros + paginación
      query,
      setQuery,
      clientId,
      setClientId,
      page: safePage,
      setPage,
      pageSize,
      setPageSize,

      meta: {
        total,
        totalPages,
        from: total === 0 ? 0 : safePage * pageSize + 1,
        to: Math.min(total, (safePage + 1) * pageSize),
      },

      refresh,
    }),
    [
      pageItemsHydrated,
      state.loading,
      state.error,
      query,
      clientId,
      safePage,
      pageSize,
      total,
      totalPages,
      refresh,
    ]
  );
}
