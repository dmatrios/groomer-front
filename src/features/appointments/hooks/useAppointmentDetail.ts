// src/features/appointments/hooks/useAppointmentDetail.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/shared/http/apiError"; // si te falla por mayúsculas: "@/shared/http/ApiError"
import { appointmentsApi, type AppointmentResponse } from "@/features/appointments/api/appointmentsApi";

type State = {
  item: AppointmentResponse | null;
  loading: boolean;
  error: string | null;
};

export function useAppointmentDetail(id: number) {
  const [state, setState] = useState<State>({
    item: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!id) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await appointmentsApi.getById(id);
      setState({ item: res.data, loading: false, error: null });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Error cargando cita";

      setState({ item: null, loading: false, error: msg });
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
