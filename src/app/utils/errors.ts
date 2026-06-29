import { HttpErrorResponse } from '@angular/common/http';

interface WithErrorTag { errorTag: string }

/**
 * Add a tag to an error object so it can be recognized later (using the errorHasTag function)
 */
export function tagError<T extends object>(error: T, tag: string): T & WithErrorTag {
  return Object.assign(error, { errorTag: tag });
}

/**
 * Duck-typed guard for HTTP errors: matches any non-null object exposing a numeric `status`.
 * We intentionally avoid `instanceof HttpErrorResponse` because some errors reaching these helpers
 * are plain objects (e.g. serialized errors) rather than actual HttpErrorResponse instances.
 */
export function isHttpErrorResponse(error: unknown): error is HttpErrorResponse {
  return typeof error === 'object' && error !== null && 'status' in error
    && typeof error.status === 'number';
}

export function errorHasTag(error: unknown, tag: string): boolean {
  return typeof error === 'object' && error !== null && 'errorTag' in error && error.errorTag === tag;
}

export function errorIsHTTPUnauthenticated(error: unknown): boolean {
  return isHttpErrorResponse(error) && error.status === 401;
}

export function errorIsHTTPForbidden(error: unknown): boolean {
  return isHttpErrorResponse(error) && error.status === 403;
}

export function errorIsHTTPNotFound(error: unknown): boolean {
  return isHttpErrorResponse(error) && error.status === 404;
}

export function errorIsBadRequest(error: unknown): boolean {
  return isHttpErrorResponse(error) && error.status === 400;
}

export function errorIsHTTPInternalServer(error: unknown): boolean {
  return isHttpErrorResponse(error) && error.status === 500;
}
