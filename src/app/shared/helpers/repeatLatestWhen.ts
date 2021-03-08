import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Operator which re-emits the latest value of the source when the given notifier emits something.
 * It can be used with subject as notifier$ to trigger a refresh of the source or re-perform a processing.
 */
export const repeatLatestWhen = <T>(notifier$: Observable<any>) =>
  (source: Observable<T>): Observable<T> =>
    combineLatest([ source, notifier$.pipe(startWith(null)) ]).pipe(
      map(([ val ]) => val),
    );
