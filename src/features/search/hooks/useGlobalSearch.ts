"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { searchApi, type SearchResponse } from "@/features/search/api/searchApi";

const STORAGE_KEY = "search.lastQuery";

export function useGlobalSearch() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastQueryRef = useRef<string>("");
  const debounceRef = useRef<number | null>(null);

  const run = useCallback(async (query: string) => {
    const clean = query.trim();

    if (!clean) {
      setData(null);
      setError(null);
      setLoading(false);
      lastQueryRef.current = "";
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await searchApi.search(clean);
      const payload = res.data ?? null;

      setData(payload);
      lastQueryRef.current = clean;

      // ✅ guardar última búsqueda
      localStorage.setItem(STORAGE_KEY, clean);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else if (e instanceof Error) setError(e.message);
      else setError("Error en búsqueda");

      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const runDebounced = useCallback(
    (query: string) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => run(query), 350);
    },
    [run]
  );

  const refresh = useCallback(() => {
    if (!lastQueryRef.current) return;
    run(lastQueryRef.current);
  }, [run]);

  // ✅ al cargar, ejecutar “última búsqueda”
  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && last.trim()) {
      setQ(last);
      run(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const hasData = useMemo(() => !!data, [data]);

  return { q, setQ, data, loading, error, run, runDebounced, refresh, hasData };
}
