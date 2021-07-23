import { pipe } from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import { Duration } from './duration';

/**
 * Decoder for Date type
 */
export const dateDecoder: D.Decoder<unknown, Date> = pipe(
  D.string,
  D.parse(s => {
    const date = Date.parse(s);
    return isNaN(date) ? D.failure(s, 'DateFromString') : D.success(new Date(date));
  })
);

/**
 * Decoder for Duration type
 */
export const durationFromStringDecoder: D.Decoder<unknown, Duration> = pipe(
  D.string,
  D.parse(s => {
    const duration = Duration.fromString(s);
    return duration.isValid() ? D.success(duration) : D.failure(s, 'DurationFromString');
  })
);

export const durationFromSecondsDecoder: D.Decoder<unknown, Duration> = pipe(
  D.number,
  D.parse(s => {
    const duration = Duration.fromSeconds(s);
    return duration.isValid() ? D.success(duration) : D.failure(s, 'DurationFromString');
  })
);
