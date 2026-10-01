import { TimeZoneNamePipe } from './timeZoneName';

describe('TimeZoneNamePipe', () => {
  const pipe = new TimeZoneNamePipe();

  it('returns the short timezone name for a valid date', () => {
    const date = new Date('2024-07-01T12:00:00Z');
    spyOn(Intl, 'DateTimeFormat').and.returnValue({
      formatToParts: () => [ { type: 'timeZoneName', value: 'CEST' } ],
    } as unknown as Intl.DateTimeFormat);
    expect(pipe.transform(date)).toBe('CEST');
  });

  it('returns an empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns an empty string for an invalid date', () => {
    expect(pipe.transform(new Date('invalid'))).toBe('');
  });
});
