import { http } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

export type UserRole = "ADMIN" | "USER";

export type UserResponse = {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  active: boolean;
};

export type CreateUserRequest = {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  forcePasswordChange: boolean;
};

export type ResetPasswordResponse = {
  temporaryPassword: string;
};

export const usersApi = {
  list(): Promise<ApiResponse<UserResponse[]>> {
    return http<ApiResponse<UserResponse[]>>("/users", { method: "GET" });
  },

  create(req: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return http<ApiResponse<UserResponse>>("/users", {
      method: "POST",
      body: req,
    });
  },

  // ✅ backend actual: "desactivate" (typo histórico)
  deactivate(id: number): Promise<ApiResponse<null>> {
    return http<ApiResponse<null>>(`/users/${id}/desactivate`, { method: "POST" });
  },

  activate(id: number): Promise<ApiResponse<null>> {
    return http<ApiResponse<null>>(`/users/${id}/activate`, { method: "POST" });
  },

  resetPassword(id: number): Promise<ApiResponse<ResetPasswordResponse>> {
    return http<ApiResponse<ResetPasswordResponse>>(`/users/${id}/reset-password`, {
      method: "POST",
    });
  },
};
