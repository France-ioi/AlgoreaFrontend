import { HttpErrorResponse } from '@angular/common/http';

class HTTPError extends Error {
  constructor(resp: HttpErrorResponse) {
    super(resp.message);
    this.name = resp.name;
  }
}

class UnknownError extends Error {
  constructor(err: unknown) {
    super(typeof err === 'object' ? JSON.stringify(err) : String(err));
    this.name = 'UnknownError';
  }
}

/**
 * Converts errors which are not instance of the `Error` class (e.g. HTTPErrorResponse) to subclass of `Error`.
 */
export function convertToError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error instanceof HttpErrorResponse) return new HTTPError(error);
  throw new UnknownError(error);
}
