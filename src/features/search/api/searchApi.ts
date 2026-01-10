import { http } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/apiResponse";

export type SearchClientHit = {
  id: number;
  code: string;
  fullName: string;        // ✅ viene así del backend
  zoneText?: string | null;
};

export type SearchPetHit = {
  id: number;
  code: string;
  name: string;
  clientId: number;
  mainPhotoUrl?: string | null;
};

export type SearchAppointmentHit = {
  id: number;
  petId: number;
  startAt: string;
  endAt: string;
  status: "PENDING" | "ATTENDED" | "CANCELED";
  // si backend manda notes u otros, los agregas aquí
};

export type SearchVisitHit = {
  id: number;
  petId: number;
  appointmentId?: number | null;
  visitedAt: string;
  totalAmount: string | number; // ✅ viene string "175.00"
};

export type SearchResponse = {
  query: string;
  clients: SearchClientHit[];
  pets: SearchPetHit[];
  appointments: SearchAppointmentHit[];
  visits: SearchVisitHit[];
};

export const searchApi = {
  // ✅ soporte futuro paginación (si backend no lo soporta, no lo uses aún)
  search(q: string, params?: { page?: number; size?: number }) {
    const qs = new URLSearchParams({ q: q.trim() });

    if (params?.page != null) qs.set("page", String(params.page));
    if (params?.size != null) qs.set("size", String(params.size));

    return http<ApiResponse<SearchResponse>>(`/search?${qs.toString()}`);
  },
};
