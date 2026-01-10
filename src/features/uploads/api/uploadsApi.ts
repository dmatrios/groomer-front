// src/features/uploads/api/uploadsApi.ts

import { httpRequest } from "@/shared/http/httpClient";
import type { ApiResponse } from "@/shared/http/types";

type UploadPetData = {
  fileName: string;
  url: string; // "/uploads/pets/xxx.jpg"
};

export const uploadsApi = {
  async uploadPetPhoto(file: File): Promise<UploadPetData> {
    const form = new FormData();
    form.append("file", file);

    const res = await httpRequest<ApiResponse<UploadPetData>>(
      "/uploads/pets",
      {
        method: "POST",
        body: form, // ✅ FormData pasa sin JSON.stringify y sin Content-Type
        timeoutMs: 30000, // opcional: subir imágenes puede tardar más
      }
    );

    return res.data;
  },
};
