"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/shared/http/apiError";
import {
  clientsApi,
  type ClientResponse,
  type ClientPhoneResponse,
  type ClientPetResponse,
} from "@/features/clients/api/clientsApi";

type State = {
  client: ClientResponse | null;
  phones: ClientPhoneResponse[];
  pets: ClientPetResponse[];
  loading: boolean;
  error: string | null;
};

export function useClientDetail(clientId: number) {
  const [state, setState] = useState<State>({
    client: null,
    phones: [],
    pets: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const [clientRes, phonesRes, petsRes] = await Promise.all([
        clientsApi.getById(clientId),
        clientsApi.listPhones(clientId),
        clientsApi.listPets(clientId),
      ]);

      setState({
        client: clientRes.data,
        phones: phonesRes.data ?? [],
        pets: petsRes.data ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo cargar el cliente";

      setState({ client: null, phones: [], pets: [], loading: false, error: message });
    }
  }, [clientId]);

  const addPhone = useCallback(
    async (phone: string) => {
      const trimmed = phone.trim();
      if (!trimmed) return;

      await clientsApi.addPhone(clientId, trimmed);
      await refresh();
    },
    [clientId, refresh]
  );

  const deletePhone = useCallback(
    async (phoneId: number) => {
      await clientsApi.deletePhone(clientId, phoneId);
      await refresh();
    },
    [clientId, refresh]
  );

  useEffect(() => {
    if (!Number.isFinite(clientId)) return;
    refresh();
  }, [clientId, refresh]);

  return useMemo(
    () => ({
      ...state,
      refresh,
      addPhone,
      deletePhone,
    }),
    [state, refresh, addPhone, deletePhone]
  );
}
