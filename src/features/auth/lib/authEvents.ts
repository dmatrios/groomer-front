// src/features/auth/lib/authEvents.ts
export const AUTH_EVENT = "groomer.auth";

export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { type: "UNAUTHORIZED" } }));
}
