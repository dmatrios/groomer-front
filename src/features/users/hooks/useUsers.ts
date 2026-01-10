"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  usersApi,
  type CreateUserRequest,
  type ResetPasswordResponse,
  type UserResponse,
} from "@/features/users/api/usersApi";

type Result<T> = { ok: true; data: T } | { ok: false; error: unknown };

type BusyAction =
  | { type: "NONE" }
  | { type: "CREATE" }
  | { type: "DEACTIVATE"; userId: number }
  | { type: "ACTIVATE"; userId: number }
  | { type: "RESET_PASSWORD"; userId: number };

export function useUsers() {
  const [items, setItems] = useState<UserResponse[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState<BusyAction>({ type: "NONE" });
  const [error, setError] = useState<unknown>(null);

  const busyUserId = useMemo(() => {
    if (
      busy.type === "DEACTIVATE" ||
      busy.type === "ACTIVATE" ||
      busy.type === "RESET_PASSWORD"
    ) {
      return busy.userId;
    }
    return null;
  }, [busy]);

  const isBusy = busy.type !== "NONE";

  const reload = useCallback(async () => {
    setLoadingList(true);
    setError(null);

    try {
      const res = await usersApi.list();
      setItems(res.data ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (req: CreateUserRequest): Promise<Result<UserResponse>> => {
      setBusy({ type: "CREATE" });
      setError(null);

      try {
        const res = await usersApi.create(req);
        await reload();

        if (!res.data) return { ok: false, error: new Error("Respuesta inválida del servidor") };
        return { ok: true, data: res.data };
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setBusy({ type: "NONE" });
      }
    },
    [reload]
  );

  const deactivate = useCallback(
    async (id: number): Promise<Result<null>> => {
      setBusy({ type: "DEACTIVATE", userId: id });
      setError(null);

      try {
        await usersApi.deactivate(id);
        await reload();
        return { ok: true, data: null };
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setBusy({ type: "NONE" });
      }
    },
    [reload]
  );

  const activate = useCallback(
    async (id: number): Promise<Result<null>> => {
      setBusy({ type: "ACTIVATE", userId: id });
      setError(null);

      try {
        await usersApi.activate(id);
        await reload();
        return { ok: true, data: null };
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setBusy({ type: "NONE" });
      }
    },
    [reload]
  );

  const resetPassword = useCallback(
    async (id: number): Promise<Result<ResetPasswordResponse>> => {
      setBusy({ type: "RESET_PASSWORD", userId: id });
      setError(null);

      try {
        const res = await usersApi.resetPassword(id);

        // ✅ mantenemos consistencia: backend suele setear mustChangePassword=true
        await reload();

        if (!res.data) return { ok: false, error: new Error("Respuesta inválida del servidor") };
        return { ok: true, data: res.data };
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setBusy({ type: "NONE" });
      }
    },
    [reload]
  );

  return {
    items,
    loadingList,
    error,
    reload,

    busy,
    isBusy,
    busyUserId,

    create,
    deactivate,
    activate,
    resetPassword,
  };
}
