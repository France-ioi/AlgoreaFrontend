import { of, OperatorFunction, pipe } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { errorState, fetchingState, FetchState, readyState } from 'src/app/shared/helpers/state';

export function mapToFetchState<T>(): OperatorFunction<T,FetchState<T>> {
  return pipe(
    map(val => readyState(val)),
    startWith(fetchingState()),
    catchError(e => of(errorState(e))),
  );
}
