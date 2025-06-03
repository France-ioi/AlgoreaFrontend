import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import { z } from 'zod';
import { Duration } from './duration';

class DecodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodingError';
  }
}

export function decode<T>(decoder: D.Decoder<unknown, T>) {
  return (input: unknown): T => pipe(decoder.decode(input), fold(
    // just throw the error if decode failed and return the value otherwise.
    error => {
      throw new DecodingError(`${D.draw(error)}\nInput: ${JSON.stringify(input)}`);
    },
    decoded => decoded,
  ));
}

export function decodeOrNull<T>(decoder: D.Decoder<unknown, T>) {
  return (input: unknown): T | null => pipe(
    decoder.decode(input),
    fold(
      () => null,
      decoded => decoded,
    ),
  );
}

/**
 * Schema for Date type
 */
export const dateSchema = z.union([ z.string(), z.number() ]).pipe(z.coerce.date());

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

export const durationSchema = z.string().transform((val, ctx) => {
  const duration = Duration.fromString(val);
  if (!duration.isValid()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a duration',
    });
    return z.NEVER;
  }
  return duration;
});
