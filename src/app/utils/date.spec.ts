import { isInfinite } from './date';

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