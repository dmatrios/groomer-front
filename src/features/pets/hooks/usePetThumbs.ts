"use client";

import { useEffect, useRef, useState } from "react";
import { petsApi } from "@/features/pets/api/petsApi";
import { ApiError } from "@/shared/http/apiError";

/**
 * Cachea mainPhotoUrl por petId para evitar refetch en cada render/búsqueda.
 * Funciona para Grid, List y Vista densa.
 */
export function usePetThumbs(petIds: number[]) {
  const cacheRef = useRef<Map<number, string | null>>(new Map());
  const inflightRef = useRef<Set<number>>(new Set());

  // “version” fuerza re-render cuando el cache se actualiza
  const [, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;

    async function run() {
      const idsToFetch = petIds.filter((id) => {
        if (cacheRef.current.has(id)) return false;
        if (inflightRef.current.has(id)) return false;
        return true;
      });

      if (idsToFetch.length === 0) return;

      // marca en vuelo
      idsToFetch.forEach((id) => inflightRef.current.add(id));

      await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const res = await petsApi.getById(id);
            const url = res.data?.mainPhotoUrl ?? null;
            cacheRef.current.set(id, url);
          } catch (e) {
            // si falla, cachea null para no spamear requests
            cacheRef.current.set(id, null);

            // opcional: si quieres loggear
            if (e instanceof ApiError) {
              // console.warn("thumb error:", e.message);
            }
          } finally {
            inflightRef.current.delete(id);
          }
        })
      );

      if (!alive) return;
      setVersion((v) => v + 1);
    }

    run();
    return () => {
      alive = false;
    };
  }, [petIds.join("|")]); // clave estable por ids visibles

  function getThumb(petId: number) {
    return cacheRef.current.get(petId) ?? null;
  }

  return { getThumb };
}
