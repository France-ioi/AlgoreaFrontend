import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import { Duration } from './duration';

export function decode<T>(decoder: D.Decoder<unknown, T>) {
  return (input: unknown): T => pipe(decoder.decode(input), fold(
    // just throw the error if decode failed and return the value otherwise.
    error => {
      // eslint-disable-next-line
      console.error(error);
      throw new Error(D.draw(error));
    },
    decoded => decoded,
  ));
}


/**
 * Decoder for Date type
 */
export const dateDecoder: D.Decoder<unknown, Date> = pipe(
  D.union(D.string, D.number),
  D.parse(stringOrNumber => {
    const date = new Date(stringOrNumber);
    return Number.isNaN(date.valueOf()) ? D.failure(stringOrNumber, 'DateFromString') : D.success(date);
  })
);

/**
 * Decoder for Duration type
 */
export const durationDecoder: D.Decoder<unknown, Duration> = pipe(
  D.string,
  D.parse(s => {
    const duration = Duration.fromString(s);
    return duration.isValid() ? D.success(duration) : D.failure(s, 'DurationFromString');
  })
);
