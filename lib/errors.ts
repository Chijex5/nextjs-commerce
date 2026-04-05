import { NextResponse } from "next/server";

// ─── Error taxonomy ───────────────────────────────────────────────────────────

export const ErrorType = {
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYMENT: "PAYMENT",
  EXTERNAL_SERVICE: "EXTERNAL_SERVICE",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

// ─── Machine-readable error codes ────────────────────────────────────────────

export const ErrorCode = {
  // Validation
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_INPUT: "INVALID_INPUT",
  // Authentication / Authorisation
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",
  // Coupon
  COUPON_NOT_FOUND: "COUPON_NOT_FOUND",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_INACTIVE: "COUPON_INACTIVE",
  COUPON_LIMIT_REACHED: "COUPON_LIMIT_REACHED",
  COUPON_USER_LIMIT: "COUPON_USER_LIMIT",
  COUPON_MIN_ORDER: "COUPON_MIN_ORDER",
  COUPON_REQUIRES_LOGIN: "COUPON_REQUIRES_LOGIN",
  COUPON_NOT_STARTED: "COUPON_NOT_STARTED",
  // Payment
  PAYMENT_NOT_CONFIGURED: "PAYMENT_NOT_CONFIGURED",
  PAYMENT_GATEWAY_TIMEOUT: "PAYMENT_GATEWAY_TIMEOUT",
  PAYMENT_GATEWAY_UNAVAILABLE: "PAYMENT_GATEWAY_UNAVAILABLE",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  // Generic resource
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── AppError class ───────────────────────────────────────────────────────────

/**
 * Structured application error that carries a safe public message, HTTP status,
 * optional machine-readable code, and an optional internal cause for logging.
 *
 * Use the factory helpers below instead of calling `new AppError` directly.
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly status: number;
  readonly code: string | undefined;
  readonly cause: unknown;

  constructor({
    type,
    message,
    status,
    code,
    cause,
  }: {
    type: ErrorType;
    message: string;
    status: number;
    code?: string;
    cause?: unknown;
  }) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

export function validationError(message: string, code?: string): AppError {
  return new AppError({
    type: ErrorType.VALIDATION,
    message,
    status: 400,
    code: code ?? ErrorCode.INVALID_INPUT,
  });
}

export function authError(
  message = "Authentication required",
  code = ErrorCode.UNAUTHENTICATED,
): AppError {
  return new AppError({
    type: ErrorType.AUTHENTICATION,
    message,
    status: 401,
    code,
  });
}

export function forbiddenError(
  message = "Access denied",
  code = ErrorCode.UNAUTHORIZED,
): AppError {
  return new AppError({
    type: ErrorType.AUTHORIZATION,
    message,
    status: 403,
    code,
  });
}

export function notFoundError(resource: string, code?: string): AppError {
  return new AppError({
    type: ErrorType.NOT_FOUND,
    message: `${resource} not found`,
    status: 404,
    code: code ?? ErrorCode.NOT_FOUND,
  });
}

export function conflictError(message: string, code?: string): AppError {
  return new AppError({
    type: ErrorType.CONFLICT,
    message,
    status: 409,
    code: code ?? ErrorCode.CONFLICT,
  });
}

export function paymentError(
  message: string,
  code?: string,
  status = 502,
): AppError {
  return new AppError({ type: ErrorType.PAYMENT, message, status, code });
}

export function internalError(
  message = "An unexpected error occurred. Please try again.",
  cause?: unknown,
): AppError {
  return new AppError({
    type: ErrorType.INTERNAL,
    message,
    status: 500,
    code: ErrorCode.INTERNAL_ERROR,
    cause,
  });
}

// ─── API response helper ──────────────────────────────────────────────────────

/**
 * Converts any thrown value into a safe, consistent `NextResponse` JSON error.
 *
 * - `AppError` values use their own `.message`, `.status`, and `.code`.
 * - All other errors are logged in full on the server, then return a generic
 *   500 so that stack traces, DB messages, and internal details never reach
 *   the client.
 *
 * @param error   The caught value (AppError, standard Error, or unknown)
 * @param context Short label used in server logs to identify which route failed
 */
export function handleApiError(
  error: unknown,
  context = "API",
): NextResponse {
  if (isAppError(error)) {
    // AppErrors carry a safe public message.
    // Log the internal cause (if any) but never send it to the client.
    if (error.cause) {
      console.error(
        `[${context}] ${error.type} (${error.status}):`,
        error.cause,
      );
    }
    const errorBody: Record<string, string> = { error: error.message };
    if (error.code) errorBody.code = error.code;
    return NextResponse.json(errorBody, { status: error.status });
  }

  // Unknown / unexpected error — log in full, return nothing internal to client
  console.error(`[${context}] Unhandled error:`, error);
  return NextResponse.json(
    {
      error: "An unexpected error occurred. Please try again.",
      code: ErrorCode.INTERNAL_ERROR,
    },
    { status: 500 },
  );
}
