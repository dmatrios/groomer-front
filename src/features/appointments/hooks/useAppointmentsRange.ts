"use client";

import { useCallback, useEffect, useState } from "react";
import { appointmentsApi, AppointmentResponse, AppointmentStatus } from "@/features/appointments/api/appointmentsApi";

type Args = {
  from: Date;
  to: Date;
  status?: AppointmentStatus;
};

export function useAppointmentsRange({ from, to, status }: Args) {
  const [items, setItems] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
