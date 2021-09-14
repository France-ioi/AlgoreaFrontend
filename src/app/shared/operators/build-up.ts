
import { OperatorFunction, pipe, concat, of, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface ObjectT { [k: string]: any }

/**
 * RxOperator which, for each input, first emits the raw input and then emits the raw input extended with the emission of an another
 * observable based on this input.
 * It is intended to be used to build up data from several async services. So it emits first the input (typically the output from another
 * service) and then uses this input for another call (e.g. request more now we know this initial info) and finally emits the merge of
 * the initial input with the output of the other call.
 * For instance, it emits `{ name: 'foo', childId: 4 }` and then `{ name: 'foo', childId: 4, childName: 'bar' }` when the child name has
 * been fetched.
 * Note that this operator uses `switchMap`, so if the source re-emits, the subrequest is cancelled.
 */
export function buildUp<T extends ObjectT, U extends ObjectT>(project: (value: T) => Observable<U>): OperatorFunction<T, T | (T & U)> {
  return pipe(
    switchMap(initialValue => concat(
      of(initialValue),
      project(initialValue).pipe(
        map(additionalValue => ({ ...initialValue, ...additionalValue }))
      ),
    ))
  );
}
