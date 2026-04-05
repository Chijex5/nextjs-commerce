/**
 * Client-side error utilities.
 *
 * Use `parseApiError` to extract a display-safe message from any API response,
 * and `getErrorMessage` to safely convert a caught value into a string for toast
 * notifications or other UI feedback.
 *
 * In development mode, raw error messages are surfaced to help with debugging.
 * In production, non-AppError values always resolve to a generic string so that
 * internal details (stack traces, DB messages, etc.) never reach the user.
 */

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Status-based fallbacks used when the API body carries no `error` field. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "The request could not be processed. Please check your input.",
  401: "Please sign in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "A conflict occurred. Please refresh and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "A server error occurred. Please try again shortly.",
  502: "A server error occurred. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The request timed out. Please try again.",
};

/** Shape of the JSON body returned by API error responses. */
export interface ApiErrorResponse {
  /** Primary error field used by all API routes. */
  error?: string;
  /** Machine-readable error code (e.g. "COUPON_EXPIRED"). */
  code?: string;
  /** Fallback message field (used by some success-shaped responses). */
  message?: string;
}

/**
 * Returns a user-friendly error message from an API `Response` and its parsed
 * JSON body.
 *
 * Priority:
 * 1. `data.error`  — explicit API error field
 * 2. `data.message` — secondary message field
 * 3. HTTP-status-based generic message
 * 4. Generic fallback
 *
 * @example
 * const res = await fetch("/api/coupons/validate", { ... });
 * const data = await res.json();
 * if (!res.ok) {
 *   toast.error(parseApiError(res, data));
 *   return;
 * }
 */
export function parseApiError(
  response: Response,
  data: ApiErrorResponse,
): string {
  if (response.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "parseApiError called with a successful response (status",
        response.status,
        "). Only call this function when response.ok is false.",
      );
    }
    return GENERIC_ERROR;
  }
  if (data.error) return data.error;
  if (data.message) return data.message;
  return STATUS_MESSAGES[response.status] ?? GENERIC_ERROR;
}

/**
 * Returns a user-friendly message from any caught value.
 *
 * In development, the raw `Error.message` is returned so issues are obvious.
 * In production, any non-string caught value becomes the generic fallback to
 * prevent leaking internal information to the user.
 *
 * @example
 * try {
 *   await doSomething();
 * } catch (err) {
 *   toast.error(getErrorMessage(err));
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string" && error) return error;

  if (error instanceof Error) {
    if (process.env.NODE_ENV === "development") {
      return error.message || GENERIC_ERROR;
    }
    return GENERIC_ERROR;
  }

  return GENERIC_ERROR;
}
