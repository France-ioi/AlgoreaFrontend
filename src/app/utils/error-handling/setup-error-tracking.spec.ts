import { HttpErrorResponse } from '@angular/common/http';
import type { ErrorEvent, EventHint } from '@sentry/angular';
import { HTTPError } from './error-conversion';
import { dropHttpErrors } from './setup-error-tracking';

const event = { event_id: 'evt' } as ErrorEvent;

function hint(originalException: unknown): EventHint {
  return { originalException };
}

describe('dropHttpErrors', () => {
  it('should drop HttpErrorResponse', () => {
    const httpErr = new HttpErrorResponse({ status: 0, statusText: 'Unknown', url: '/x' });
    expect(dropHttpErrors(event, hint(httpErr))).toBeNull();
  });

  it('should drop HTTPError (the convertToError wrapper)', () => {
    const httpErr = new HttpErrorResponse({ status: 500, statusText: 'OK', url: '/x' });
    expect(dropHttpErrors(event, hint(new HTTPError(httpErr)))).toBeNull();
  });

  it('should keep non-HTTP errors', () => {
    expect(dropHttpErrors(event, hint(new Error('boom')))).toBe(event);
  });

  it('should keep events with no originalException', () => {
    expect(dropHttpErrors(event, hint(undefined))).toBe(event);
  });
});
