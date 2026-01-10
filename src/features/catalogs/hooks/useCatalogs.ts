// src/features/catalogs/hooks/useCatalogs.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { catalogsApi, type CatalogItem } from "../api/catalogsApi";

type State = {
  items: CatalogItem[];
  loading: boolean;
  error: string | null;
};

type CatalogHook = {
  items: CatalogItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
  update: (id: number, name: string) => Promise<void>;
};

type CatalogApi = {
  list: () => Promise<{ data: CatalogItem[] }>;
  create: (name: string) => Promise<unknown>;
  update: (id: number, name: string) => Promise<unknown>;
  errorLabel: string;
};

function useCatalogBase(api: CatalogApi): CatalogHook {
  const apiRef = useRef<CatalogApi>(api);
  apiRef.current = api;

  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await apiRef.current.list();
      setState({
        items: res.data ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : apiRef.current.errorLabel;

      setState({ items: [], loading: false, error: message });
    }
  }, []);

  const create = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      await apiRef.current.create(trimmed);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const update = useCallback(async (id: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      await apiRef.current.update(id, trimmed);
      await refresh();
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh,
      create,
      update,
    }),
    [state, refresh, create, update]
  );
}

/* =========================
   HOOKS POR CATÁLOGO
   ========================= */

export function useZonesCatalog() {
  return useCatalogBase({
    list: async () => {
      const res = await catalogsApi.zones.list();
      return { data: res.data ?? [] };
    },
    create: async (name) => catalogsApi.zones.create(name),
    update: async (id, name) => catalogsApi.zones.update(id, name),
    errorLabel: "Error cargando zonas",
  });
}

export function useTreatmentTypesCatalog() {
  return useCatalogBase({
    list: async () => {
      const res = await catalogsApi.treatmentTypes.list();
      return { data: res.data ?? [] };
    },
    create: async (name) => catalogsApi.treatmentTypes.create(name),
    update: async (id, name) => catalogsApi.treatmentTypes.update(id, name),
    errorLabel: "Error cargando tipos de tratamiento",
  });
}

export function useMedicinesCatalog() {
  return useCatalogBase({
    list: async () => {
      const res = await catalogsApi.medicines.list();
      return { data: res.data ?? [] };
    },
    create: async (name) => catalogsApi.medicines.create(name),
    update: async (id, name) => catalogsApi.medicines.update(id, name),
    errorLabel: "Error cargando medicinas",
  });
}
