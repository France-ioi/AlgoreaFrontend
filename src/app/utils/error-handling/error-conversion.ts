import { HttpErrorResponse } from '@angular/common/http';

export class HTTPError extends Error {
  constructor(resp: HttpErrorResponse) {
    super(resp.message);
    this.name = resp.name;
  }
}

export class UnknownError extends Error {
  constructor(err: unknown) {
    super(stringifyUnknown(err));
    this.name = 'UnknownError';
  }
}

function stringifyUnknown(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const json = JSON.stringify(err);
    // XPCOM / Firefox privacy exceptions often stringify as '{}' but have a useful toString().
    if (json === '{}') {
      try {
        const text = (err as { toString(): string }).toString();
        if (text !== '[object Object]') return text;
      } catch {
        // keep '{}'
      }
    }
    return json;
  }
  if (typeof err === 'string') return err;
  if (err === undefined) return 'undefined';
  if (err === null) return 'null';
  // err is now `number | bigint | boolean | symbol | function`; all have a safe `toString`.
  return (err as { toString(): string }).toString();
}

/**
 * True for Error-like throwables (including getter-based XPCOM/DOMException objects) that are
 * not `instanceof Error` but expose string `name` and `message` via property access.
 * Getter access is guarded: Firefox dead-object wrappers can throw ("can't access dead object").
 */
function isErrorLike(error: unknown): error is { name: string, message: string, stack?: unknown } {
  if (error === null || error === undefined || typeof error !== 'object') return false;
  try {
    const { name, message } = error as { name?: unknown, message?: unknown };
    return typeof name === 'string' && typeof message === 'string';
  } catch {
    return false;
  }
}

/**
 * Converts errors which are not instance of the `Error` class (e.g. HTTPErrorResponse) to subclass of `Error`.
 */
export function convertToError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error instanceof HttpErrorResponse) return new HTTPError(error);
  if (isErrorLike(error)) {
    try {
      const converted = new Error(error.message);
      converted.name = error.name;
      const stack = error.stack;
      if (typeof stack === 'string') converted.stack = stack;
      return converted;
    } catch {
      // Getter may throw on a later read (e.g. dead XPCOM wrapper); keep ErrorHandler safe.
      return new UnknownError(error);
    }
  }
  return new UnknownError(error);
}
