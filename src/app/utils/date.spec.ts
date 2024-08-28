import { isInfinite, isPastDate } from './date';
import { MINUTES } from './duration';

describe('isInfinite', () => {
  it('should consider as infinite the db max value returned by the backend', () => {
    const value = '9999-12-31T23:59:59Z';
    expect(isInfinite(new Date(value))).toBeTrue();
  });

  it('should not consider as infinite a date around now', () => {
    const value = '2030-01-01';
    expect(isInfinite(new Date(value))).toBeFalse();
  });

});

describe('isPastDate', () => {
  it('should return yes for 1min ago', () => {
    expect(isPastDate(new Date(Date.now() - 1 * MINUTES))).toBeTrue();
  });

  it('should return no for in 30 min', () => {
    expect(isPastDate(new Date(Date.now() + 30 * MINUTES))).toBeFalse();
  });

});
