"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import { petsApi, type PetPhotoResponse, type PetResponse } from "../api/petsApi";

type State = {
  pet: PetResponse | null;
  photos: PetPhotoResponse[];
  loading: boolean;
  error: string | null;
};

export function usePetDetail(petId: number) {
  const [state, setState] = useState<State>({
    pet: null,
    photos: [],
    loading: true,
    error: null,
  });

  const isValidId = Number.isFinite(petId) && petId > 0;

  const refresh = useCallback(async () => {
    if (!isValidId) {
      setState({ pet: null, photos: [], loading: false, error: "ID de mascota inválido" });
      return;
    }

    setState((s) => ({
      ...s,
      loading: true,
      error: null,
    }));

    try {
      const [petRes, photosRes] = await Promise.all([petsApi.getById(petId), petsApi.listPhotos(petId)]);

      setState({
        pet: petRes.data ?? null,
        photos: photosRes.data ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo cargar la mascota";

      setState({ pet: null, photos: [], loading: false, error: msg });
    }
  }, [petId, isValidId]);

  const makePrimary = useCallback(
    async (photoId: number) => {
      if (!isValidId) return;
      await petsApi.makePrimary(petId, photoId);
      await refresh();
    },
    [petId, refresh, isValidId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh,
      makePrimary,
      isValidId,
    }),
    [state, refresh, makePrimary, isValidId]
  );
}
