import { HttpErrorResponse } from '@angular/common/http';

interface WithErrorTag { errorTag: string }

/**
 * Add a tag to an error object so it can be recognized later (using the errorHasTag function)
 */
export function tagError<T extends object>(error: T, tag: string): T & WithErrorTag {
  return Object.assign(error, { errorTag: tag });
}

export function errorHasTag(error: any, tag: string): boolean {
  return (error as WithErrorTag).errorTag === tag;
}

export function errorIsHTTPUnauthenticated(error: any): boolean {
  return 'status' in error && (error as HttpErrorResponse).status === 401;
}

export function errorIsHTTPForbidden(error: any): boolean {
  return 'status' in error && (error as HttpErrorResponse).status === 403;
}

export function errorIsHTTPNotFound(error: any): boolean {
  return 'status' in error && (error as HttpErrorResponse).status === 404;
}

export function errorIsBadRequest(error: any): boolean {
  return 'status' in error && (error as HttpErrorResponse).status === 400;
}

export function errorIsHTTPInternalServer(error: any): boolean {
  return 'status' in error && (error as HttpErrorResponse).status === 500;
}
