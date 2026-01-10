// src/features/pets/hooks/useClientPets.ts
"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/shared/http/apiError"; // si te falla por mayúsculas: "@/shared/http/ApiError"
import { petsApi, type PetResponse } from "@/features/pets/api/petsApi";

type State = {
  data: PetResponse[];
  loading: boolean;
  error: string | null;
};

export function useClientPets(clientId: number) {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!clientId) return;

    let mounted = true;

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const res = await petsApi.list(clientId);
        const data = res.data ?? [];
        if (!mounted) return;
        setState({ data, loading: false, error: null });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Error cargando mascotas del cliente";

        if (!mounted) return;
        setState({ data: [], loading: false, error: msg });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  return state;
}
