export interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
}

/** Any failed API call. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string[]>;
  readonly traceId?: string;

  constructor({ status, code, message, fieldErrors = {}, traceId }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.traceId = traceId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

function readFieldErrors(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};
  const fieldErrors: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(value)) {
    const list = (Array.isArray(messages) ? messages : [messages]).filter(nonEmptyString);
    if (list.length > 0) fieldErrors[field] = list;
  }
  return fieldErrors;
}

/** Builds an ApiError from an error response body (RFC 7807 problem details when available). */
export function parseApiError(status: number, body: unknown): ApiError {
  const problem = isRecord(body) ? body : {};
  return new ApiError({
    status,
    code: nonEmptyString(problem.code) ? problem.code : `HTTP_${status}`,
    message: nonEmptyString(problem.detail)
      ? problem.detail
      : nonEmptyString(problem.title)
        ? problem.title
        : `Request failed with status ${status}`,
    fieldErrors: readFieldErrors(problem.errors),
    traceId: nonEmptyString(problem.traceId) ? problem.traceId : undefined,
  });
}

/** A message that is safe and useful to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 0) return 'Unable to reach the server. Check your connection and try again.';
    if (error.status === 401) return 'Your session has expired. Please sign in again.';
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
