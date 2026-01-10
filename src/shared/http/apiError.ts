// src/shared/http/apiError.ts

export type ApiErrorKind =
  | "VALIDATION"    // 400
  | "NOT_FOUND"     // 404
  | "BUSINESS"      // 409
  | "UNAUTHORIZED"  // 401 (futuro)
  | "FORBIDDEN"     // 403 (futuro)
  | "SERVER"        // 500
  | "NETWORK"       // sin respuesta / timeout
  | "UNKNOWN";

export type ApiErrorDetails = unknown;

export class ApiError extends Error {
  public readonly kind: ApiErrorKind;
  public readonly status?: number;

  /** Código semántico del backend (ErrorCode enum) */
  public readonly code?: string;

  /** Detalle crudo (ApiErrorResponse, stack, etc.) */
  public readonly details?: ApiErrorDetails;

  constructor(params: {
    message: string;
    kind: ApiErrorKind;
    status?: number;
    code?: string;
    details?: ApiErrorDetails;
  }) {
    super(params.message);
    this.name = "ApiError";

    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}
