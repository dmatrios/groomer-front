"use client";

import { useEffect, useState } from "react";
import { catalogsApi, type CatalogItem } from "@/features/catalogs/api/catalogsApi";
import { ApiError } from "@/shared/http/apiError";

type State = {
  items: CatalogItem[];
  loading: boolean;
  error: string | null;
};

export function useZonesList() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await catalogsApi.zones.list();
        if (!alive) return;
        setState({
          items: res.data ?? [],
          loading: false,
          error: null,
        });
      } catch (e) {
        if (!alive) return;
        const msg =
          e instanceof ApiError ? e.message : "Error cargando zonas";
        setState({ items: [], loading: false, error: msg });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
