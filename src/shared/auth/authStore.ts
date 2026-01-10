// src/shared/auth/authStore.ts

export type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
};

type Listener = (state: AuthState) => void;

const state: AuthState = {
  // Placeholder: hoy lo dejamos en true para poder navegar “privado” sin login.
  // Luego lo ponemos en false por defecto cuando ya exista login real.
  isAuthenticated: true,
  token: null,
};

const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener({ ...state });
}

export const authStore = {
  getState(): AuthState {
    return { ...state };
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  login(fakeToken?: string) {
    state.isAuthenticated = true;
    state.token = fakeToken ?? null; // mañana será el JWT real
    notify();
  },

  logout() {
    state.isAuthenticated = false;
    state.token = null;
    notify();
  },
};
