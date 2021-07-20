import { OperatorFunction, pipe } from 'rxjs';
import { pairwise, startWith } from 'rxjs/operators';
import { fetchingState, FetchState } from '../helpers/state';

export function withPreviousFetchState<T>(
  defaultState: FetchState<T> = fetchingState()
): OperatorFunction<FetchState<T>, [ FetchState<T>, FetchState<T> ]> {
  return pipe(
    startWith(defaultState),
    pairwise(),
  );
}
