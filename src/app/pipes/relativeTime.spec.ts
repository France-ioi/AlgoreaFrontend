import { RelativeTimePipe } from './relativeTime';
import { DAYS, MINUTES, MONTHS, WEEKS } from '../utils/duration';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from '../services/localeService';

describe('RelativeTimePipe', () => {
  let localeService: LocaleService;
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    localeService = TestBed.inject(LocaleService);
    pipe = new RelativeTimePipe(localeService);
  });

  it('transforms now date to "Just now"', () => {
    expect(pipe.transform(new Date())).toBe('Just now');
  });

  it('transforms to "1 minute ago"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date((currentDate.getTime() - MINUTES) - 1))).toBe('1 minute ago');
  });

  it('transforms to "3 minutes ago"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date(currentDate.getTime() - (MINUTES * 3)))).toBe('3 minutes ago');
  });

  it('transforms to "yesterday"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date((currentDate.getTime() - DAYS) - 1))).toBe('yesterday');
  });

  it('transforms to "3 days ago"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date((currentDate.getTime() - (DAYS * 3))))).toBe('3 days ago');
  });

  it('transforms to "last week"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date((currentDate.getTime() - WEEKS) - 1))).toBe('last week');
  });

  it('transforms to "4 weeks ago"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date(currentDate.getTime() - (WEEKS * 4)))).toBe('4 weeks ago');
  });

  it('transforms to "3 months ago"', () => {
    const currentDate = new Date();
    expect(pipe.transform(new Date(currentDate.getTime() - (MONTHS * 3)))).toBe('3 months ago');
  });

  it('should throw error', () => {
    expect(() => pipe.transform('invalid value')).toThrow(new Error('Unexpected: Invalid date value: \'invalid value\''));
  });
});
