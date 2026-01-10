"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { tokenStorage, type AuthUser } from "@/features/auth/lib/tokenStorage";
import { AUTH_EVENT } from "@/features/auth/lib/authEvents";
import { http } from "@/shared/http/httpClient";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;

  isAuthenticated: boolean;
  isAdmin: boolean;

  login: (payload: { token: string; user: AuthUser }) => void;
  logout: () => void;

  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  /* =========================
     Hydrate desde storage
     ========================= */
  useEffect(() => {
    setToken(tokenStorage.getToken());
    setUser(tokenStorage.getUser());
  }, []);

  /* =========================
     Login / Logout
     ========================= */
  const login = useCallback(
    ({ token, user }: { token: string; user: AuthUser }) => {
      tokenStorage.setToken(token);
      tokenStorage.setUser(user);
      setToken(token);
      setUser(user);
    },
    []
  );

  const logout = useCallback(() => {
    tokenStorage.clearAll();
    setToken(null);
    setUser(null);
  }, []);

  /* =========================
     Refresh /me
     ========================= */
  const refreshMe = useCallback(async () => {
    const currentToken = tokenStorage.getToken();
    if (!currentToken) {
      logout();
      return;
    }

    try {
      const res = await http<ApiResponse<AuthUser>>("/auth/me", {
        method: "GET",
        token: currentToken,
      });

      tokenStorage.setUser(res.data);
      setUser(res.data);
    } catch {
      // token inválido / expirado
      logout();
    }
  }, [logout]);

  /* =========================
     Escuchar 401 global
     ========================= */
  useEffect(() => {
    function onAuthEvent(e: Event) {
      const ce = e as CustomEvent;
      if (ce.detail?.type === "UNAUTHORIZED") logout();
    }
    window.addEventListener(AUTH_EVENT, onAuthEvent);
    return () => window.removeEventListener(AUTH_EVENT, onAuthEvent);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "ADMIN",
      login,
      logout,
      refreshMe,
    }),
    [user, token, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
