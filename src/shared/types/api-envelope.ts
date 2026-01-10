export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    sort?: string;
  };
  warnings?: string[] | null;
};
