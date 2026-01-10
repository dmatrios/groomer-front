// src/features/appointments/api/appointmentsApi.ts

import { httpRequest } from "@/shared/http/httpClient";
import { toIsoLocal } from "@/features/appointments/utils/dates";

export type AppointmentStatus = "PENDING" | "ATTENDED" | "CANCELED";

export type AppointmentResponse = {
  id: number;
  petId: number;
  startAt: string; // "YYYY-MM-DDTHH:mm:ss"
  endAt: string;   // "YYYY-MM-DDTHH:mm:ss"
  status: AppointmentStatus;
  notes?: string | null;
};

export type ApiResponse<T> = {
  data: T;
  meta?: {
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    sort?: string;
  };
  warnings?: string[];
};

export type AppointmentCreateRequest = {
  petId: number;
  startAt: string;
  endAt: string;
  notes?: string | null;
};

export type AppointmentUpdateRequest = {
  startAt: string;
  endAt: string;
  notes?: string | null;
};

export type AppointmentRescheduleRequest = {
  startAt: string;
  endAt: string;
  reason: string;
};

export type AppointmentCancelRequest = {
  reason: string;
  chargeMethod?: string | null;
  chargeAmount?: number | null;
};

export const appointmentsApi = {
  // ✅ GET /api/v1/appointments?from&to&status
  async list(params: {
    from: Date;
    to: Date;
    status?: AppointmentStatus;
  }): Promise<ApiResponse<AppointmentResponse[]>> {
    const q = new URLSearchParams();
    q.set("from", toIsoLocal(params.from));
    q.set("to", toIsoLocal(params.to));
    if (params.status) q.set("status", params.status);

    // ✅ SIN /api/v1 (tu baseUrl ya lo incluye)
    return httpRequest<ApiResponse<AppointmentResponse[]>>(
      `/appointments?${q.toString()}`,
      { method: "GET" }
    );
  },

  // ✅ GET /api/v1/appointments/{id}
  async getById(id: number): Promise<ApiResponse<AppointmentResponse>> {
    return httpRequest<ApiResponse<AppointmentResponse>>(`/appointments/${id}`, {
      method: "GET",
    });
  },

  // ✅ POST /api/v1/appointments?forceOverlap=true|false
  async create(
    payload: AppointmentCreateRequest,
    opts?: { forceOverlap?: boolean }
  ): Promise<ApiResponse<AppointmentResponse>> {
    const forceOverlap = opts?.forceOverlap ?? false;

    return httpRequest<ApiResponse<AppointmentResponse>>(
      `/appointments?forceOverlap=${String(forceOverlap)}`,
      {
        method: "POST",
        body: payload,
      }
    );
  },

  // ✅ PUT /api/v1/appointments/{id}?forceOverlap=...
  async update(
    id: number,
    payload: AppointmentUpdateRequest,
    opts?: { forceOverlap?: boolean }
  ): Promise<ApiResponse<AppointmentResponse>> {
    const forceOverlap = opts?.forceOverlap ?? false;

    return httpRequest<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}?forceOverlap=${String(forceOverlap)}`,
      {
        method: "PUT",
        body: payload,
      }
    );
  },

  // ✅ POST /api/v1/appointments/{id}/reschedule?forceOverlap=...
  async reschedule(
    id: number,
    payload: AppointmentRescheduleRequest,
    opts?: { forceOverlap?: boolean }
  ): Promise<ApiResponse<AppointmentResponse>> {
    const forceOverlap = opts?.forceOverlap ?? false;

    return httpRequest<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/reschedule?forceOverlap=${String(forceOverlap)}`,
      {
        method: "POST",
        body: payload,
      }
    );
  },

  // ✅ POST /api/v1/appointments/{id}/cancel
  async cancel(
    id: number,
    payload: AppointmentCancelRequest
  ): Promise<ApiResponse<AppointmentResponse>> {
    return httpRequest<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/cancel`,
      {
        method: "POST",
        body: payload,
      }
    );
  },

  // ✅ POST /api/v1/appointments/{id}/attend
  async attend(id: number): Promise<ApiResponse<AppointmentResponse>> {
    return httpRequest<ApiResponse<AppointmentResponse>>(
      `/appointments/${id}/attend`,
      { method: "POST" }
    );
  },
};
