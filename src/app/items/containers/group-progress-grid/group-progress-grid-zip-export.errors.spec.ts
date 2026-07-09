import { SECONDS } from 'src/app/utils/duration';
import { mapZipExportError } from './group-progress-grid-zip-export.errors';

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
      name: 'items limit',
      status: 400,
      errorText: 'The number of items exceeds the limit (100)',
      expectedType: 'message',
      expectedLife: 10 * SECONDS,
      messageIncludes: '100 items',
    },
    {
      name: 'users limit',
      status: 400,
      errorText: 'The number of users exceeds the limit (100)',
      expectedType: 'message',
      expectedLife: 10 * SECONDS,
      messageIncludes: '100 users',
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
      name: 'unexpected server error',
      status: 500,
      errorText: 'Internal error',
      expectedType: 'unexpected',
    },
  ];

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
