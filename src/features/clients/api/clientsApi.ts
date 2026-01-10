import { httpRequest } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

export type ClientResponse = {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  zoneId: number | null;
  zoneText: string | null;
  notes: string | null;
};

export type ClientCreateRequest = {
  firstName: string;
  lastName: string;
  zoneId?: number | null;
  zoneText?: string | null;
  notes?: string | null;
};

export type ClientPhoneResponse = {
  id: number;
  phone: string;
};

/**
 * ✅ Mascotas por cliente (summary)
 * Endpoint: GET /clients/{id}/pets
 * OJO: este tipo es intencionalmente pequeño.
 * Si luego necesitas más campos, lo ampliamos.
 */
export type ClientPetResponse = {
  id: number;
  code: string;
  name: string;
};

export const clientsApi = {
  list: (params?: {
    zoneId?: number;
    page?: number;
    size?: number;
    sort?: string;
  }) => {
    const q = new URLSearchParams();

    if (params?.zoneId !== undefined) q.set("zoneId", String(params.zoneId));
    q.set("page", String(params?.page ?? 0));
    q.set("size", String(params?.size ?? 10));
    q.set("sort", params?.sort ?? "lastName");

    return httpRequest<ApiResponse<ClientResponse[]>>(`/clients?${q.toString()}`);
  },

  getById: (id: number) =>
    httpRequest<ApiResponse<ClientResponse>>(`/clients/${id}`),

  create: (body: ClientCreateRequest) =>
    httpRequest<ApiResponse<ClientResponse>>(`/clients`, {
      method: "POST",
      body,
    }),

  update: (id: number, body: ClientCreateRequest) =>
    httpRequest<ApiResponse<ClientResponse>>(`/clients/${id}`, {
      method: "PUT",
      body,
    }),

  // Phones
  listPhones: (clientId: number) =>
    httpRequest<ApiResponse<ClientPhoneResponse[]>>(`/clients/${clientId}/phones`),

  addPhone: (clientId: number, phone: string) =>
    httpRequest<ApiResponse<ClientPhoneResponse>>(`/clients/${clientId}/phones`, {
      method: "POST",
      body: { phone },
    }),

/**
 * Si tu backend responde 204, deja ApiResponse<void>.
 * Si responde data=null, deja ApiResponse<null>.
 * Ajusta según tu backend real.
 */
  deletePhone: (clientId: number, phoneId: number) =>
    httpRequest<ApiResponse<void>>(`/clients/${clientId}/phones/${phoneId}`, {
      method: "DELETE",
    }),

  // ✅ Pets por cliente
  listPets: (clientId: number) =>
    httpRequest<ApiResponse<ClientPetResponse[]>>(`/clients/${clientId}/pets`),
};
