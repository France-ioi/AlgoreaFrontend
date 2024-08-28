import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store, createSelector } from '@ngrx/store';
import { filter, interval, map, of, switchMap } from 'rxjs';
import { fromItemContent } from 'src/app/items/store';
import { DurationAsCountdownPipe } from 'src/app/pipes/duration';
import { isInfinite, isPastDate } from 'src/app/utils/date';
import { Duration } from 'src/app/utils/duration';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';

/**
 * Select the current result, will be`null` if we know for sure there is no current result and `undefined` if it is not known yet.
 */
const selectCurrentResult = createSelector(
  fromItemContent.selectActiveContentResults,
  resultsState => (resultsState.isReady ? (resultsState.data.currentResult ?? null) : undefined)
);

/**
 * Time until when we can submit. `null` if no current result or no limit on submission time. `undefined` if not known yet.
 */
const selectAllowsSubmissionsUntil = createSelector(
  fromItemContent.selectIsItemContentActive,
  selectCurrentResult,
  (isItem, result) => {
    if (!isItem) return null;
    if (result === undefined) return undefined;
    return (result === null || isInfinite(result.allowsSubmissionsUntil) ? null : result.allowsSubmissionsUntil);
  }
);

@Component({
  selector: 'alg-time-limited-content-info',
  standalone: true,
  imports: [
    DurationAsCountdownPipe,
  ],
  templateUrl: './time-limited-content-info.component.html',
  styleUrl: './time-limited-content-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeLimitedContentInfoComponent {

  timeRemaining = toSignal(
    this.store.select(selectAllowsSubmissionsUntil).pipe(
      filter(isNotUndefined), // still use the previous state when we don't know about the new one
      switchMap(submissionUntil => {
        if (!submissionUntil) return of(null);
        const timeRemaining = Duration.fromNowUntil(submissionUntil);
        if (!timeRemaining.getMs()) return of(new Duration(0));
        return interval(1000).pipe(
          map(() => (isPastDate(submissionUntil) ? new Duration(0) : Duration.fromNowUntil(submissionUntil))),
        );
      }),
    ), { initialValue: null }
  );

  constructor(
    private store: Store
  ) {}

}

