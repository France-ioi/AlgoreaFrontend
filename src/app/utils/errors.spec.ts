import { HttpErrorResponse } from '@angular/common/http';
import {
  errorHasTag,
  errorIsBadRequest,
  errorIsHTTPForbidden,
  errorIsHTTPInternalServer,
  errorIsHTTPNotFound,
  errorIsHTTPUnauthenticated,
  isHttpErrorResponse,
  tagError,
} from './errors';

describe('errors utils', () => {
  describe('isHttpErrorResponse', () => {
    it('should return true for an HttpErrorResponse', () => {
      expect(isHttpErrorResponse(new HttpErrorResponse({ status: 403 }))).toBe(true);
    });

    it('should return true for a duck-typed object with a numeric status', () => {
      expect(isHttpErrorResponse({ status: 404 })).toBe(true);
    });

    it('should return false for non-HTTP errors and edge inputs without throwing', () => {
      expect(isHttpErrorResponse(new Error('boom'))).toBe(false);
      expect(isHttpErrorResponse({ message: 'no status' })).toBe(false);
      expect(isHttpErrorResponse({ status: 'not-a-number' })).toBe(false);
      expect(isHttpErrorResponse(null)).toBe(false);
      expect(isHttpErrorResponse(undefined)).toBe(false);
      expect(isHttpErrorResponse('some string')).toBe(false);
      expect(isHttpErrorResponse(42)).toBe(false);
    });

    it('should not throw on null/undefined inputs', () => {
      expect(() => isHttpErrorResponse(null)).not.toThrow();
      expect(() => isHttpErrorResponse(undefined)).not.toThrow();
    });
  });

  describe('errorIsHTTP* helpers', () => {
    const cases: { name: string, status: number, fn: (error: unknown) => boolean }[] = [
      { name: 'errorIsHTTPUnauthenticated', status: 401, fn: errorIsHTTPUnauthenticated },
      { name: 'errorIsHTTPForbidden', status: 403, fn: errorIsHTTPForbidden },
      { name: 'errorIsHTTPNotFound', status: 404, fn: errorIsHTTPNotFound },
      { name: 'errorIsBadRequest', status: 400, fn: errorIsBadRequest },
      { name: 'errorIsHTTPInternalServer', status: 500, fn: errorIsHTTPInternalServer },
    ];

    cases.forEach(({ name, status, fn }) => {
      describe(name, () => {
        it(`should return true for an HttpErrorResponse with status ${status}`, () => {
          expect(fn(new HttpErrorResponse({ status }))).toBe(true);
          expect(fn({ status })).toBe(true);
        });

        it('should return false for a non-matching status', () => {
          expect(fn(new HttpErrorResponse({ status: 418 }))).toBe(false);
          expect(fn({ status: 418 })).toBe(false);
        });

        it('should return false (without throwing) for non-HTTP and edge inputs', () => {
          expect(fn(new Error('boom'))).toBe(false);
          expect(fn({ message: 'no status' })).toBe(false);
          expect(fn(null)).toBe(false);
          expect(fn(undefined)).toBe(false);
          expect(fn('some string')).toBe(false);
          expect(fn(42)).toBe(false);
        });
      });
    });
  });

  describe('tagError / errorHasTag', () => {
    it('should tag an error and recognize it', () => {
      const error = tagError(new Error('boom'), 'my-tag');
      expect(errorHasTag(error, 'my-tag')).toBe(true);
      expect(errorHasTag(error, 'other-tag')).toBe(false);
    });

    it('should return false (without throwing) for edge inputs', () => {
      expect(errorHasTag(null, 'my-tag')).toBe(false);
      expect(errorHasTag(undefined, 'my-tag')).toBe(false);
      expect(errorHasTag('some string', 'my-tag')).toBe(false);
      expect(errorHasTag(42, 'my-tag')).toBe(false);
      expect(errorHasTag({}, 'my-tag')).toBe(false);
    });
  });
});
