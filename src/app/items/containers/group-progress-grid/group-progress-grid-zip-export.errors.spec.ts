import { HttpErrorResponse } from '@angular/common/http';
import { SECONDS } from 'src/app/utils/duration';
import { mapZipExportError, readHttpActionError } from './group-progress-grid-zip-export.errors';

describe('mapZipExportError', () => {
  const cases: {
    name: string,
    status: number,
    errorText?: string,
    expectedType: 'message' | 'unexpected',
    expectedLife?: number,
    messageIncludes?: string,
  }[] = [
    {
      name: 'user-item entries limit',
      status: 400,
      errorText: 'The number of user-item entries exceeds the limit (100000)',
      expectedType: 'message',
      expectedLife: 10 * SECONDS,
      messageIncludes: 'too large',
    },
    {
      name: '403 forbidden',
      status: 403,
      errorText: 'Insufficient access rights',
      expectedType: 'message',
      messageIncludes: 'permission to export answers',
    },
    {
      name: '401 unauthorized',
      status: 401,
      errorText: 'Invalid access token',
      expectedType: 'message',
      messageIncludes: 'not authorized',
    },
    {
      name: 'serverless unavailable',
      status: 503,
      errorText: 'Internal error',
      expectedType: 'message',
      messageIncludes: 'temporarily unavailable',
    },
    {
      name: 'export start failure',
      status: 404,
      expectedType: 'message',
      messageIncludes: 'could not be started',
    },
    {
      name: 'unexpected client error',
      status: 418,
      errorText: 'I am a teapot',
      expectedType: 'unexpected',
    },
  ];

  it('readHttpActionError extracts error_text from JSON bodies', () => {
    const err = new HttpErrorResponse({
      error: { error_text: 'Insufficient access rights' },
      status: 403,
    });
    expect(readHttpActionError(err)).toEqual({
      status: 403,
      errorText: 'Insufficient access rights',
    });
  });

  cases.forEach(({ name, status, errorText, expectedType, expectedLife, messageIncludes }) => {
    it(`maps ${name}`, () => {
      const result = mapZipExportError(status, errorText);

      expect(result.type).toBe(expectedType);
      if (expectedType === 'message') {
        if (!('message' in result)) {
          fail('Expected message feedback');
          return;
        }
        if (messageIncludes) {
          expect(result.message.toLowerCase()).toContain(messageIncludes.toLowerCase());
        }
        if (expectedLife !== undefined) {
          expect(result.life).toBe(expectedLife);
        }
      }
    });
  });
});
