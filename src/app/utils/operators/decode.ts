import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { ZodType, ZodTypeDef } from 'zod';
import { OperatorFunction, pipe as rxpipe } from 'rxjs';
import { decode } from '../decoders';
import { snakeToCamelKeys } from '../case_conversion';

/**
 * Decode an object with keys in snake_case (typically from a json) to one with its types checked and keys in camelCase
 */
export function decodeSnakeCase<T>(decoder: D.Decoder<unknown, T>): OperatorFunction<unknown,T> {
  return rxpipe(
    map(snakeToCamelKeys),
    map(input => {
      try {
        return decode(decoder)(input);
      } catch (err) {
        reportError(err);
        throw err;
      }
    }),
  );
}

export function decodeSnakeCaseZod<
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
        reportError(err);
        throw err;
      }
    }),
  );
}
