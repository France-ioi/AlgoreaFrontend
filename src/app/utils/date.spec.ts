import { formatTimeZoneName, isInfinite, isPastDate } from './date';
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

describe('formatTimeZoneName', () => {
  it('returns the short timezone name from Intl for the given date', () => {
    const date = new Date('2024-07-01T12:00:00Z');
    spyOn(Intl, 'DateTimeFormat').and.returnValue({
      formatToParts: () => [ { type: 'timeZoneName', value: 'CEST' } ],
    } as unknown as Intl.DateTimeFormat);
    expect(formatTimeZoneName(date)).toBe('CEST');
    expect(Intl.DateTimeFormat).toHaveBeenCalledWith('en-GB', { timeZoneName: 'short' });
  });

  it('returns an empty string when Intl provides no timezone name', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    spyOn(Intl, 'DateTimeFormat').and.returnValue({
      formatToParts: () => [],
    } as unknown as Intl.DateTimeFormat);
    expect(formatTimeZoneName(date)).toBe('');
  });
});
