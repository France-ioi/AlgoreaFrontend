import { Observable, of } from 'rxjs';
import { catchError, mapTo, startWith } from 'rxjs/operators';

/**
 * Operator to indicate if the source action is pending
 * - Until a value is added to the stream, the action is pending.
 * - When a value is added to the stream, the action is finished.
 * - When an error is received, the action is finished.
 */
export function mapPending() {
  return (source: Observable<any>): Observable<boolean> => source.pipe(
    mapTo(false),
    startWith(true),
    catchError(() => of(false)),
  );
}
