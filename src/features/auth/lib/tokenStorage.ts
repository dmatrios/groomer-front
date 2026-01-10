// src/features/auth/lib/tokenStorage.ts

const TOKEN_KEY = "groomer.token";
const USER_KEY = "groomer.user";

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "USER";
  active: boolean;
  mustChangePassword?: boolean;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    return safeJsonParse<AuthUser>(localStorage.getItem(USER_KEY));
  },

  setUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearUser() {
    localStorage.removeItem(USER_KEY);
  },

  clearAll() {
    this.clearToken();
    this.clearUser();
  },
} as const;
