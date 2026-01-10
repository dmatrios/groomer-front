import { http } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  role: "ADMIN" | "USER";
  active: boolean;
  mustChangePassword: boolean;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string; // "Bearer"
  expiresInSeconds: number;
  user: AuthUser;
};

export type MeResponse = AuthUser;

export type ChangePasswordRequest = {
  /**
   * Solo se envía cuando NO es forzado.
   * Cuando mustChangePassword=true, el backend suele permitir omitirla.
   */
  currentPassword?: string;
  newPassword: string;
};

export type ChangePasswordResponse = null;

/** POST /api/v1/auth/login */
export function loginApi(req: LoginRequest) {
  return http<ApiResponse<LoginResponse>>("/auth/login", {
    method: "POST",
    body: req,
  });
}

/** GET /api/v1/auth/me */
export function meApi() {
  return http<ApiResponse<MeResponse>>("/auth/me", {
    method: "GET",
  });
}

/** POST /api/v1/auth/change-password */
export function changePasswordApi(req: ChangePasswordRequest) {
  return http<ApiResponse<ChangePasswordResponse>>("/auth/change-password", {
    method: "POST",
    body: req,
  });
}
