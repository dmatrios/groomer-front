export type ApiResponse<T> = {
  data: T;
  meta?: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    sort?: string;
  } | null;
  warnings?: string[] | null;
};
