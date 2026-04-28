import { HttpErrorResponse } from '@angular/common/http';

class HTTPError extends Error {
  constructor(resp: HttpErrorResponse) {
    super(resp.message);
    this.name = resp.name;
  }
}

class UnknownError extends Error {
  constructor(err: unknown) {
    super(stringifyUnknown(err));
    this.name = 'UnknownError';
  }
}

function stringifyUnknown(err: unknown): string {
  if (typeof err === 'object' && err !== null) return JSON.stringify(err);
  if (typeof err === 'string') return err;
  if (err === undefined) return 'undefined';
  if (err === null) return 'null';
  // err is now `number | bigint | boolean | symbol | function`; all have a safe `toString`.
  return (err as { toString(): string }).toString();
}

/**
 * Converts errors which are not instance of the `Error` class (e.g. HTTPErrorResponse) to subclass of `Error`.
 */
export function convertToError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error instanceof HttpErrorResponse) return new HTTPError(error);
  return new UnknownError(error);
}
