import { HttpErrorResponse } from '@angular/common/http';
import { isItemUnavailableError } from './item-unavailable-error';
import { NO_SUCH_ALIAS_ERROR_NAME } from './item-route-validation';

describe('isItemUnavailableError', () => {
  it('should return true for HTTP 403', () => {
    expect(isItemUnavailableError(new HttpErrorResponse({ status: 403 }))).toBe(true);
  });

  it('should return true for HTTP 404', () => {
    expect(isItemUnavailableError(new HttpErrorResponse({ status: 404 }))).toBe(true);
  });

  it('should return true for an error whose name is the no-such-alias name', () => {
    const error = new Error('boom');
    error.name = NO_SUCH_ALIAS_ERROR_NAME;
    expect(isItemUnavailableError(error)).toBe(true);
  });

  it('should return false (without throwing) for unrelated errors and edge inputs', () => {
    expect(isItemUnavailableError(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isItemUnavailableError({ status: 500 })).toBe(false);
    expect(isItemUnavailableError(new Error('boom'))).toBe(false);
    expect(isItemUnavailableError(null)).toBe(false);
    expect(isItemUnavailableError(undefined)).toBe(false);
  });
});
