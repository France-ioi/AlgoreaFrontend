import { map } from 'rxjs/operators';
import { ZodType, ZodTypeDef } from 'zod';
import { OperatorFunction, pipe as rxpipe } from 'rxjs';
import { snakeToCamelKeys } from '../case_conversion';
import { reportAnError } from '../error-handling/error-reporting';

/**
 * Decode an object with keys in snake_case (typically from a json) to one with its types checked and keys in camelCase
 */
export function decodeSnakeCase<
  Output,
  Def extends ZodTypeDef,
  Input
>(schema: ZodType<Output,Def,Input>): OperatorFunction<unknown,Output> {
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
