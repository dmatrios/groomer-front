export type PetResponse = {
  id: number;
  code: string;
  clientId: number;
  name: string;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  temperament?: string;
  weight?: number;
  notes?: string;
  mainPhotoUrl?: string | null;
  active: boolean;
};
