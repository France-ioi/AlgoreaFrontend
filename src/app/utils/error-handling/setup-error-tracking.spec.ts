import { HttpErrorResponse } from '@angular/common/http';
import type { Breadcrumb, ErrorEvent, EventHint } from '@sentry/angular';
import { HTTPError } from './error-conversion';
import {
  beforeBreadcrumb,
  beforeSend,
  dropHttpErrors,
  dropOpaqueFirefoxNsErrors,
} from './setup-error-tracking';

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

  it('should drop when originalException is a converted Error with NS_ERROR_FAILURE and empty message', () => {
    const converted = new Error('');
    converted.name = 'NS_ERROR_FAILURE';
    expect(dropOpaqueFirefoxNsErrors(event, hint(converted))).toBeNull();
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

  it('should drop chunk loading errors', () => {
    const chunkEvent = exceptionEvent('TypeError', 'Importing a module script failed.');
    expect(beforeSend(chunkEvent, hint(undefined))).toBeNull();
  });

  it('should keep actionable errors', () => {
    const boom = exceptionEvent('Error', 'boom');
    expect(beforeSend(boom, hint(new Error('boom')))).toBe(boom);
  });
});

function httpBreadcrumb(category: 'xhr' | 'fetch', statusCode: number): Breadcrumb {
  return { category, data: { method: 'GET', url: '/x', status_code: statusCode } };
}

function fakeXhr(options: {
  headers?: Record<string, string | null>,
  throwingHeaders?: readonly string[],
  responseType?: string,
  responseText?: string,
  throwOnResponseText?: boolean,
}): object {
  const headers = options.headers ?? {};
  const throwing = new Set(options.throwingHeaders ?? []);
  return {
    responseType: options.responseType ?? '',
    get responseText(): string {
      if (options.throwOnResponseText) throw new Error('responseText');
      return options.responseText ?? '';
    },
    getResponseHeader: (name: string): string | null => {
      const key = name.toLowerCase();
      if (throwing.has(key)) throw new Error(key);
      if (!Object.prototype.hasOwnProperty.call(headers, key)) return null;
      return headers[key] ?? null;
    },
  };
}

function xhrHint(xhr: object, start = 1000, end = 1003): object {
  return { xhr, startTimestamp: start, endTimestamp: end };
}

describe('beforeBreadcrumb', () => {
  it('should leave non-http categories unchanged', () => {
    const breadcrumb: Breadcrumb = { category: 'ui.click', message: 'click' };
    expect(beforeBreadcrumb(breadcrumb, xhrHint(fakeXhr({})))).toBe(breadcrumb);
  });

  it('should add no keys when hint, xhr, or getResponseHeader is missing', () => {
    const breadcrumb = httpBreadcrumb('xhr', 403);
    expect(beforeBreadcrumb(breadcrumb)).toBe(breadcrumb);
    expect(beforeBreadcrumb(breadcrumb, { startTimestamp: 1, endTimestamp: 2 })).toBe(breadcrumb);
    expect(beforeBreadcrumb(breadcrumb, { xhr: {}, startTimestamp: 1, endTimestamp: 4 })).toBe(breadcrumb);
  });

  it('should return the original breadcrumb when the xhr getter throws', () => {
    const breadcrumb = httpBreadcrumb('xhr', 403);
    const throwingHint = {
      get xhr(): object {
        throw new Error('xhr');
      },
    };
    expect(() => beforeBreadcrumb(breadcrumb, throwingHint)).not.toThrow();
    expect(beforeBreadcrumb(breadcrumb, throwingHint)).toBe(breadcrumb);
  });

  it('should set duration_ms including status 0', () => {
    const breadcrumb = httpBreadcrumb('xhr', 0);
    const result = beforeBreadcrumb(breadcrumb, xhrHint(fakeXhr({}), 10.2, 13.8));
    expect(result.data?.['duration_ms']).toBe(4);
    expect(result.data?.['method']).toBe('GET');
    expect(result.data?.['url']).toBe('/x');
    expect(result.data?.['status_code']).toBe(0);
  });

  it('should copy only allow-listed present headers', () => {
    const xhr = fakeXhr({
      headers: {
        'cache-control': null,
        'content-type': 'application/json',
        'backend-version': 'v1',
        date: 'Wed, 01 Jan 2020 00:00:00 GMT',
        'x-algorea-token': 'secret-header',
        age: '12',
      },
    });
    const result = beforeBreadcrumb(httpBreadcrumb('xhr', 200), xhrHint(xhr));
    expect(result.data?.['response.cache-control']).toBeUndefined();
    expect(result.data?.['response.content-type']).toBe('application/json');
    expect(result.data?.['response.backend-version']).toBe('v1');
    expect(result.data?.['response.date']).toBe('Wed, 01 Jan 2020 00:00:00 GMT');
    expect(result.data?.['response.x-algorea-token']).toBeUndefined();
    expect(result.data?.['response.age']).toBeUndefined();
    expect(result.data?.['transfer_size']).toBeUndefined();
    expect(result.data?.['encoded_body_size']).toBeUndefined();
  });

  it('should keep other headers and duration when one header read throws', () => {
    const xhr = fakeXhr({
      headers: { 'content-type': 'text/html' },
      throwingHeaders: [ 'cache-control' ],
    });
    const result = beforeBreadcrumb(httpBreadcrumb('xhr', 500), xhrHint(xhr, 5, 8));
    expect(result.data?.['duration_ms']).toBe(3);
    expect(result.data?.['response.cache-control']).toBeUndefined();
    expect(result.data?.['response.content-type']).toBe('text/html');
  });

  it('should capture xhr bodies at status >= 400 for text types only', () => {
    const longBody = 'e'.repeat(250);
    const atLimit = 'x'.repeat(200);
    const bodyOf = (status: number, xhr: object): unknown =>
      beforeBreadcrumb(httpBreadcrumb('xhr', status), xhrHint(xhr)).data?.['response_body'];

    expect(bodyOf(400, fakeXhr({ responseText: 'err' }))).toBe('err');
    expect(bodyOf(399, fakeXhr({ responseText: 'err' }))).toBeUndefined();
    expect(bodyOf(200, fakeXhr({ responseText: longBody }))).toBeUndefined();

    const truncated = beforeBreadcrumb(httpBreadcrumb('xhr', 403), xhrHint(fakeXhr({ responseText: longBody })));
    expect(truncated.data?.['response_body']).toBe('e'.repeat(200));
    expect(truncated.data?.['response_body_truncated']).toBe(true);

    const exact = beforeBreadcrumb(httpBreadcrumb('xhr', 400), xhrHint(fakeXhr({ responseText: atLimit })));
    expect(exact.data?.['response_body']).toBe(atLimit);
    expect(exact.data?.['response_body_truncated']).toBeUndefined();

    const empty = beforeBreadcrumb(httpBreadcrumb('xhr', 403), xhrHint(fakeXhr({ responseText: '' })));
    expect(empty.data?.['response_body']).toBe('');
    expect(empty.data?.['response_body_truncated']).toBeUndefined();

    expect(bodyOf(403, fakeXhr({ responseType: 'text', responseText: 'json-err' }))).toBe('json-err');
    expect(bodyOf(403, fakeXhr({ responseType: 'json', responseText: 'nope' }))).toBeUndefined();
    expect(bodyOf(403, fakeXhr({ responseType: 'blob', responseText: 'nope' }))).toBeUndefined();

    const throwing = beforeBreadcrumb(httpBreadcrumb('xhr', 500), xhrHint(fakeXhr({ throwOnResponseText: true })));
    expect(throwing.data?.['response_body']).toBeUndefined();
    expect(throwing.data?.['duration_ms']).toBe(3);
  });

  it('should enrich fetch with duration and headers but never a body', () => {
    const fetchHint = {
      response: {
        headers: {
          get: (name: string): string | null => {
            if (name === 'content-type') return 'application/json';
            return null;
          },
        },
      },
      startTimestamp: 1,
      endTimestamp: 11,
    };
    const result = beforeBreadcrumb(httpBreadcrumb('fetch', 403), fetchHint);
    expect(result.data?.['duration_ms']).toBe(10);
    expect(result.data?.['response.content-type']).toBe('application/json');
    expect(result.data?.['response_body']).toBeUndefined();
    expect(result.data?.['status_code']).toBe(403);
    const noResponse = httpBreadcrumb('fetch', 0);
    expect(beforeBreadcrumb(noResponse, { startTimestamp: 1, endTimestamp: 2 })).toBe(noResponse);
  });

  it('should never copy Authorization or hint.input into data', () => {
    const xhr = fakeXhr({ headers: { authorization: 'Bearer secret', 'content-type': 'text/plain' } });
    const result = beforeBreadcrumb(httpBreadcrumb('xhr', 401), { ...xhrHint(xhr), input: '{"password":"x"}' });
    expect(result.data?.['response.authorization']).toBeUndefined();
    expect(result.data?.['authorization']).toBeUndefined();
    expect(result.data?.['input']).toBeUndefined();
    expect(JSON.stringify(result.data)).not.toContain('password');
    expect(result.data?.['response.content-type']).toBe('text/plain');
  });
});
