import { HttpErrorResponse } from '@angular/common/http';
import type { ErrorEvent, EventHint } from '@sentry/angular';
import { HTTPError } from './error-conversion';
import { beforeSend, dropHttpErrors, dropOpaqueFirefoxNsErrors } from './setup-error-tracking';

const event = { event_id: 'evt' } as ErrorEvent;

function hint(originalException: unknown): EventHint {
  return { originalException };
}

function exceptionEvent(type: string, value: string): ErrorEvent {
  return {
    event_id: 'evt',
    exception: { values: [{ type, value }] },
  } as ErrorEvent;
}

function multiExceptionEvent(exceptions: { type: string, value: string }[]): ErrorEvent {
  return {
    event_id: 'evt',
    exception: { values: exceptions },
  } as ErrorEvent;
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

describe('dropOpaqueFirefoxNsErrors', () => {
  it('should drop NS_ERROR_FAILURE with empty/opaque message', () => {
    const opaque = exceptionEvent('NS_ERROR_FAILURE', 'No error message');
    expect(dropOpaqueFirefoxNsErrors(opaque, hint(undefined))).toBeNull();
  });

  it('should drop NS_ERROR_ABORT with empty message', () => {
    const opaque = exceptionEvent('NS_ERROR_ABORT', '');
    expect(dropOpaqueFirefoxNsErrors(opaque, hint(undefined))).toBeNull();
  });

  it('should drop when message is only whitespace around the opaque text', () => {
    const opaque = exceptionEvent('NS_ERROR_FAILURE', '  No error message  ');
    expect(dropOpaqueFirefoxNsErrors(opaque, hint(undefined))).toBeNull();
  });

  it('should keep NS_ERROR_FAILURE that carries a real message', () => {
    const useful = exceptionEvent('NS_ERROR_FAILURE', 'Component returned failure code');
    expect(dropOpaqueFirefoxNsErrors(useful, hint(undefined))).toBe(useful);
  });

  it('should keep other NS_ERROR_* types even with an opaque message', () => {
    const otherNs = exceptionEvent('NS_ERROR_DOM_ABORT', 'No error message');
    expect(dropOpaqueFirefoxNsErrors(otherNs, hint(undefined))).toBe(otherNs);
  });

  it('should keep non-NS_ERROR exceptions', () => {
    const other = exceptionEvent('TypeError', 'x is undefined');
    expect(dropOpaqueFirefoxNsErrors(other, hint(undefined))).toBe(other);
  });

  it('should keep events with no exception values and no originalException', () => {
    expect(dropOpaqueFirefoxNsErrors(event, hint(undefined))).toBe(event);
  });

  it('should drop when originalException is an opaque Firefox DOMException-like object', () => {
    const domEx = { name: 'NS_ERROR_FAILURE', message: 'No error message' };
    expect(dropOpaqueFirefoxNsErrors(event, hint(domEx))).toBeNull();
  });

  it('should keep mixed chains that include an actionable error', () => {
    const mixed = multiExceptionEvent([
      { type: 'NS_ERROR_FAILURE', value: 'No error message' },
      { type: 'TypeError', value: 'x is undefined' },
    ]);
    expect(dropOpaqueFirefoxNsErrors(mixed, hint(undefined))).toBe(mixed);
  });

  it('should drop chains where every exception is an opaque FAILURE/ABORT', () => {
    const allOpaque = multiExceptionEvent([
      { type: 'NS_ERROR_FAILURE', value: 'No error message' },
      { type: 'NS_ERROR_ABORT', value: '' },
    ]);
    expect(dropOpaqueFirefoxNsErrors(allOpaque, hint(undefined))).toBeNull();
  });
});

describe('beforeSend', () => {
  it('should drop HTTP errors before Firefox filtering', () => {
    const httpErr = new HttpErrorResponse({ status: 0, statusText: 'Unknown', url: '/x' });
    expect(beforeSend(event, hint(httpErr))).toBeNull();
  });

  it('should drop opaque Firefox NS_ERROR events', () => {
    const opaque = exceptionEvent('NS_ERROR_FAILURE', 'No error message');
    expect(beforeSend(opaque, hint(undefined))).toBeNull();
  });

  it('should keep actionable errors', () => {
    const boom = exceptionEvent('Error', 'boom');
    expect(beforeSend(boom, hint(new Error('boom')))).toBe(boom);
  });
});
