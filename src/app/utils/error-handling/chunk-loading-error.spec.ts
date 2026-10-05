import type { ErrorEvent, EventHint } from '@sentry/angular';
import { isChunkLoadingErrorMessage } from './chunk-loading-error';
import { dropChunkLoadingErrors } from './setup-error-tracking';

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

describe('isChunkLoadingErrorMessage', () => {
  it('should match known per-browser chunk loading messages', () => {
    expect(isChunkLoadingErrorMessage('Loading chunk 42 failed')).toBeTrue();
    expect(isChunkLoadingErrorMessage('Failed to fetch dynamically imported module: http://x')).toBeTrue();
    expect(isChunkLoadingErrorMessage('error loading dynamically imported module: http://x')).toBeTrue();
    expect(isChunkLoadingErrorMessage('Importing a module script failed.')).toBeTrue();
  });

  it('should not match near-miss messages without a chunk id', () => {
    expect(isChunkLoadingErrorMessage('Loading chunk failed')).toBeFalse();
  });

  it('should not match unrelated messages', () => {
    expect(isChunkLoadingErrorMessage('boom')).toBeFalse();
  });
});

describe('dropChunkLoadingErrors', () => {
  const chunkMessages = [
    'Loading chunk 42 failed',
    'Failed to fetch dynamically imported module: http://example.com/chunk.js',
    'error loading dynamically imported module: http://example.com/chunk.js',
    'Importing a module script failed.',
  ];

  for (const message of chunkMessages) {
    it(`should drop via exception.values for: ${message}`, () => {
      const chunkEvent = exceptionEvent('TypeError', message);
      expect(dropChunkLoadingErrors(chunkEvent, hint(undefined))).toBeNull();
    });

    it(`should drop via originalException for: ${message}`, () => {
      expect(dropChunkLoadingErrors(event, hint(new Error(message)))).toBeNull();
    });
  }

  it('should drop when a chunk message is in a non-first exception.values entry', () => {
    const chained = multiExceptionEvent([
      { type: 'Error', value: 'wrapper' },
      { type: 'TypeError', value: 'Failed to fetch dynamically imported module: http://example.com/chunk.js' },
    ]);
    expect(dropChunkLoadingErrors(chained, hint(undefined))).toBeNull();
  });

  it('should keep near-miss messages without a chunk id', () => {
    const nearMiss = exceptionEvent('Error', 'Loading chunk failed');
    expect(dropChunkLoadingErrors(nearMiss, hint(new Error('Loading chunk failed')))).toBe(nearMiss);
  });

  it('should keep unrelated errors', () => {
    const other = exceptionEvent('Error', 'boom');
    expect(dropChunkLoadingErrors(other, hint(new Error('boom')))).toBe(other);
  });

  it('should keep events with no exception values and no originalException', () => {
    expect(dropChunkLoadingErrors(event, hint(undefined))).toBe(event);
  });
});
