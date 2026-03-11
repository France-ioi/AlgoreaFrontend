import { computeRefreshInterval, formatRelativeTime } from './format-relative-time';
import { DAYS, HOURS, MINUTES, MONTHS, WEEKS, YEARS } from './duration';

describe('formatRelativeTime', () => {
  it('transforms now date to "Just now"', () => {
    expect(formatRelativeTime(new Date())).toBe('Just now');
  });

  it('transforms to "1 minute ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - MINUTES - 1))).toBe('1 minute ago');
  });

  it('transforms to "3 minutes ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - MINUTES * 3))).toBe('3 minutes ago');
  });

  it('transforms to "yesterday"', () => {
    expect(formatRelativeTime(new Date(Date.now() - DAYS - 1))).toBe('yesterday');
  });

  it('transforms to "3 days ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - DAYS * 3))).toBe('3 days ago');
  });

  it('transforms to "last week"', () => {
    expect(formatRelativeTime(new Date(Date.now() - WEEKS - 1))).toBe('last week');
  });

  it('transforms to "4 weeks ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - WEEKS * 4))).toBe('4 weeks ago');
  });

  it('transforms to "3 months ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - MONTHS * 3))).toBe('3 months ago');
  });

  it('transforms to "last year"', () => {
    expect(formatRelativeTime(new Date(Date.now() - YEARS - 1))).toBe('last year');
  });

  it('transforms to "2 years ago"', () => {
    expect(formatRelativeTime(new Date(Date.now() - YEARS * 2))).toBe('2 years ago');
  });

  it('should throw error on invalid date', () => {
    expect(() => formatRelativeTime('invalid value')).toThrow(new Error('Unexpected: Invalid date value: \'invalid value\''));
  });
});

describe('computeRefreshInterval', () => {
  it('returns 10s for a date less than 1 minute old', () => {
    expect(computeRefreshInterval(new Date(Date.now() - 30_000))).toBe(10_000);
  });

  it('returns 30s for a date less than 1 hour old', () => {
    expect(computeRefreshInterval(new Date(Date.now() - 5 * MINUTES))).toBe(30_000);
  });

  it('returns 5 minutes for a date less than 1 day old', () => {
    expect(computeRefreshInterval(new Date(Date.now() - 3 * HOURS))).toBe(5 * MINUTES);
  });

  it('returns 30 minutes for a date older than 1 day', () => {
    expect(computeRefreshInterval(new Date(Date.now() - 2 * DAYS))).toBe(30 * MINUTES);
  });
});
