import { pipe } from 'fp-ts/lib/function';
import * as D from 'io-ts/Decoder';

/**
 * Decoder for Date type
 */
export const dateDecoder: D.Decoder<unknown, Date> = pipe(
  D.string,
  D.parse(s => {
    const date = Date.parse(s);
    return isNaN(date) ? D.failure(s, "DateFromString") : D.success(new Date(date));
  })
);
