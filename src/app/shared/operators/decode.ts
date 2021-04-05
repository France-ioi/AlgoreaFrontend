import { map } from 'rxjs/operators';
import * as D from 'io-ts/Decoder';
import { pipe } from 'fp-ts/lib/function';
import { fold } from 'fp-ts/lib/Either';
import { OperatorFunction, pipe as rxpipe } from 'rxjs';
import { keysToCamel } from '../helpers/case_conversion';

/**
 * Decode an object with keys in snake_case (typically from a json) to one with its types checked and keys in camelCase
 */
export function decodeSnakeCase<T>(decoder: D.Decoder<unknown, T>): OperatorFunction<unknown,T> {
  return rxpipe(
    map(input => pipe(decoder.decode(keysToCamel(input)), fold(
      // just throw the error if decode failed and retrun the value otherwise.
      error => {
        throw new Error(D.draw(error));
      },
      decoded => decoded,
    )))
  );
}
