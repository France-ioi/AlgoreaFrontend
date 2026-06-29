import { HttpErrorResponse } from '@angular/common/http';
import { IsHttpForbiddenPipe, IsHttpNotFoundPipe } from './http-error.pipes';

describe('http-error pipes', () => {
  describe('IsHttpForbiddenPipe', () => {
    const pipe = new IsHttpForbiddenPipe();

    it('should return true only for a 403 error', () => {
      expect(pipe.transform(new HttpErrorResponse({ status: 403 }))).toBe(true);
      expect(pipe.transform({ status: 403 })).toBe(true);
    });

    it('should return false for other statuses and non-HTTP errors', () => {
      expect(pipe.transform(new HttpErrorResponse({ status: 404 }))).toBe(false);
      expect(pipe.transform(new Error('boom'))).toBe(false);
      expect(pipe.transform(null)).toBe(false);
      expect(pipe.transform(undefined)).toBe(false);
    });
  });

  describe('IsHttpNotFoundPipe', () => {
    const pipe = new IsHttpNotFoundPipe();

    it('should return true only for a 404 error', () => {
      expect(pipe.transform(new HttpErrorResponse({ status: 404 }))).toBe(true);
      expect(pipe.transform({ status: 404 })).toBe(true);
    });

    it('should return false for other statuses and non-HTTP errors', () => {
      expect(pipe.transform(new HttpErrorResponse({ status: 403 }))).toBe(false);
      expect(pipe.transform(new Error('boom'))).toBe(false);
      expect(pipe.transform(null)).toBe(false);
      expect(pipe.transform(undefined)).toBe(false);
    });
  });
});
