// src/features/appointments/hooks/useAppointmentsList.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  appointmentsApi,
  AppointmentResponse,
  AppointmentStatus,
} from "@/features/appointments/api/appointmentsApi";
import { endOfDay, startOfDay } from "@/features/appointments/utils/dates";

type Args = {
  date: Date;
  status?: AppointmentStatus;
};

export function useAppointmentsList({ date, status }: Args) {
  const [items, setItems] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => startOfDay(date), [date]);
  const to = useMemo(() => endOfDay(date), [date]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await appointmentsApi.list({ from, to, status });
      setItems(res.data ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Error cargando citas");
    } finally {
      setLoading(false);
    }
  }, [from, to, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    loading,
    error,
    refresh: load,
  };
}
