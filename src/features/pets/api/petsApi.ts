import { httpRequest } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

export type PetSpecies = "DOG" | "CAT";
export type PetSize = "SMALL" | "MEDIUM" | "LARGE";
export type PetTemperament = "CALM" | "NORMAL" | "AGGRESSIVE";

export type PetResponse = {
  id: number;
  code: string;
  clientId: number;
  name: string;

  species: PetSpecies;          // ✅ NUEVO
  size: PetSize;
  temperament: PetTemperament;

  weight: number | null;
  notes: string | null;
  mainPhotoUrl: string | null;  // GET /pets/{id}
};

export type PetPhotoResponse = {
  id: number;
  url: string;
  primary: boolean;
};

export type PetCreateRequest = {
  clientId: number;
  name: string;

  species: PetSpecies;          // ✅ NUEVO
  size: PetSize;
  temperament: PetTemperament;

  weight: number | null;
  notes: string | null;
};

export type PetUpdateRequest = {
  name: string;

  species: PetSpecies;          // ✅ NUEVO
  size: PetSize;
  temperament: PetTemperament;

  weight: number | null;
  notes: string | null;
};


export type PetStatsResponse = {
  visitsCount: number;
  lastVisit: { id: number; visitedAt: string } | null;
};

export const petsApi = {
  list: (clientId?: number) => {
    const qs = clientId != null ? `?clientId=${clientId}` : "";
    return httpRequest<ApiResponse<PetResponse[]>>(`/pets${qs}`);
  },

  getById: (id: number) => httpRequest<ApiResponse<PetResponse>>(`/pets/${id}`),

  create: (body: PetCreateRequest) =>
    httpRequest<ApiResponse<PetResponse>>(`/pets`, { method: "POST", body }),

  update: (id: number, body: PetUpdateRequest) =>
    httpRequest<ApiResponse<PetResponse>>(`/pets/${id}`, { method: "PUT", body }),

  // Fotos
  addPhoto: (id: number, url: string) =>
    httpRequest<ApiResponse<PetPhotoResponse>>(`/pets/${id}/photos`, {
      method: "POST",
      body: { url },
    }),

  listPhotos: (id: number) =>
    httpRequest<ApiResponse<PetPhotoResponse[]>>(`/pets/${id}/photos`),

  makePrimary: (id: number, photoId: number) =>
    httpRequest<ApiResponse<void>>(`/pets/${id}/photos/${photoId}/make-primary`, {
      method: "POST",
    }),

      getStats: (id: number) =>
    httpRequest<ApiResponse<PetStatsResponse>>(`/pets/${id}/stats`),
};
