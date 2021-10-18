import { OperatorFunction, pipe, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';

interface Options {
  maxAttempts: number,
  delay: number,
}
export function retryAfter<T>({ maxAttempts, delay }: Options): OperatorFunction<T, T> {
  return pipe(
    retryWhen(errors => errors.pipe(mergeMap((error, index) => {
      const count = index + 1;
      if (count > maxAttempts) return throwError(error);
      return timer(delay);
    }))),
  );
}
