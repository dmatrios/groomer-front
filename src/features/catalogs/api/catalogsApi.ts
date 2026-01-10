// src/features/catalogs/api/catalogsApi.ts
import { httpRequest } from "@/shared/http/httpClient";

export type ApiResponse<T> = {
  data: T;
  warnings: string[];
  meta: any;
};

export type CatalogItem = {
  id: number;
  name: string;
  normalizedName: string;
};

export const catalogsApi = {
  zones: {
    list: () => httpRequest<ApiResponse<CatalogItem[]>>("/catalogs/zones"),
    create: (name: string) =>
      httpRequest<ApiResponse<CatalogItem>>("/catalogs/zones", {
        method: "POST",
        body: { name },
      }),
    update: (id: number, name: string) =>
      httpRequest<ApiResponse<CatalogItem>>(`/catalogs/zones/${id}`, {
        method: "PUT",
        body: { name },
      }),
  },

  treatmentTypes: {
    list: () =>
      httpRequest<ApiResponse<CatalogItem[]>>("/catalogs/treatment-types"),
    create: (name: string) =>
      httpRequest<ApiResponse<CatalogItem>>("/catalogs/treatment-types", {
        method: "POST",
        body: { name },
      }),
    update: (id: number, name: string) =>
      httpRequest<ApiResponse<CatalogItem>>(`/catalogs/treatment-types/${id}`, {
        method: "PUT",
        body: { name },
      }),
  },

  medicines: {
    list: () => httpRequest<ApiResponse<CatalogItem[]>>("/catalogs/medicines"),
    create: (name: string) =>
      httpRequest<ApiResponse<CatalogItem>>("/catalogs/medicines", {
        method: "POST",
        body: { name },
      }),
    update: (id: number, name: string) =>
      httpRequest<ApiResponse<CatalogItem>>(`/catalogs/medicines/${id}`, {
        method: "PUT",
        body: { name },
      }),
  },
};
