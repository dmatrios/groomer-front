// src/features/appointments/hooks/usePetPicker.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";
import { ApiError } from "@/shared/http/apiError"; // si te falla por mayúsculas: cambia a "@/shared/http/ApiError"

type State = {
  items: PetResponse[];
  loading: boolean;
  error: string | null;
};

export function usePetPicker() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await petsApi.list(undefined); // ✅ listado general
      const raw = res.data ?? [];
      setState({ items: raw, loading: false, error: null });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando mascotas";

      setState({ items: [], loading: false, error: msg });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.items.slice(0, 50); // ✅ límite MVP para no renderizar 1000

    return state.items
      .filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const code = (p.code ?? "").toLowerCase();
        const idText = String(p.id);
        const clientText = String(p.clientId);
        return (
          name.includes(q) ||
          code.includes(q) ||
          idText.includes(q) ||
          clientText.includes(q)
        );
      })
      .slice(0, 50);
  }, [state.items, query]);

  return useMemo(
    () => ({
      items: filtered,
      loading: state.loading,
      error: state.error,
      query,
      setQuery,
      refresh,
      total: state.items.length,
    }),
    [filtered, state.loading, state.error, query, refresh, state.items.length]
  );
}
