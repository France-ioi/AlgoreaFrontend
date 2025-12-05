import { map } from 'rxjs/operators';
import { z } from 'zod';
import { OperatorFunction, pipe as rxpipe } from 'rxjs';
import { snakeToCamelKeys } from '../case_conversion';
import { reportAnError } from '../error-handling/error-reporting';

/**
 * Decode an object with keys in snake_case (typically from a json) to one with its types checked and keys in camelCase
 */
export function decodeSnakeCase<Output>(schema: z.ZodType<Output>): OperatorFunction<unknown, Output> {
  return rxpipe(
    map(snakeToCamelKeys),
    map(input => {
      try {
        return schema.parse(input);
      } catch (err) {
        reportAnError(err);
        throw err;
      }
    }),
  );
}
