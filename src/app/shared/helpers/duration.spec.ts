import { Duration, MAX_DURATION } from './duration';

const DURATION_STRING = '100:12:15';
const DURATION_STRING_IN_MS = 360735000;
const DURATION_INVALID_STRING = '100:';
const MAX_DURATION_STRING = '838:59:59';

describe('duration', () => {
  it('should return duration object from string', () => {
    const duration = new Duration(DURATION_STRING_IN_MS);
    expect(Duration.fromString(DURATION_STRING)).toEqual(duration);
  });

  it('should return valid state', () => {
    expect(new Duration(MAX_DURATION).isValid()).toBeTrue();
  });

  it('should return invalid state', () => {
    expect(Duration.fromString(DURATION_INVALID_STRING).isValid()).toBeFalse();
    expect(new Duration(MAX_DURATION + 1).isValid()).toBeFalse();
  });

  it('should return ms result', () => {
    expect(Duration.fromString(DURATION_STRING).getMS()).toEqual(DURATION_STRING_IN_MS);
    expect(new Duration(MAX_DURATION).getMS()).toEqual(MAX_DURATION);
  });

  it('should return hours, minutes, seconds tuple', () => {
    expect(Duration.fromString(DURATION_STRING).getHMS()).toEqual([ '100', '12', '15' ]);
    expect(new Duration(MAX_DURATION).getHMS()).toEqual([ '838', '59', '59' ]);
  });

  it('should return formatted duration string', () => {
    expect(Duration.fromString(DURATION_STRING).toString()).toEqual(DURATION_STRING);
    expect(new Duration(MAX_DURATION).toString()).toEqual(MAX_DURATION_STRING);
  });
});
