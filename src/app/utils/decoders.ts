import * as z from 'zod';
import { Duration } from './duration';

/**
 * Schema for Date type
 */
export const dateSchema = z.union([ z.string(), z.number() ]).pipe(z.coerce.date());

/**
 * Schema for Duration type
 */
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
