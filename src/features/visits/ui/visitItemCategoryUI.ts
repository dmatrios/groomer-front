// src/features/visits/ui/visitItemCategoryUI.ts
import { VisitItemCategory } from "@/features/visits/api/visitsApi";

export const visitItemCategoryUI: Record<
  VisitItemCategory,
  { label: string }
> = {
  BATH: { label: "Baño" },
  HAIRCUT: { label: "Corte" },
  TREATMENT: { label: "Tratamiento" },
  OTHER: { label: "Otro" },
};
