import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { OperatorFunction, pipe as rxpipe } from 'rxjs';
import { decode } from '../helpers/decoders';
import { snakeToCamelKeys } from '../helpers/case_conversion';

/**
 * Decode an object with keys in snake_case (typically from a json) to one with its types checked and keys in camelCase
 */
export function decodeSnakeCase<T>(decoder: D.Decoder<unknown, T>): OperatorFunction<unknown,T> {
  return rxpipe(
    map(snakeToCamelKeys),
    map(decode(decoder)),
  );
}
