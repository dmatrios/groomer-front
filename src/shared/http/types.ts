export type ApiResponseMeta = {
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  sort?: string;
};

export type ApiResponse<T> = {
  data: T;
  warnings?: string[];
  meta?: ApiResponseMeta | null;
};
