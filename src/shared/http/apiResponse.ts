export type ApiResponse<T> = {
  data: T;
  warnings?: string[];
  meta?: unknown;
};
