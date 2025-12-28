import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store, createSelector } from '@ngrx/store';
import { filter, interval, map, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { fromItemContent } from 'src/app/items/store';
import { DurationAsCountdownPipe } from 'src/app/pipes/duration';
import { isInfinite } from 'src/app/utils/date';
import { fromTimeOffset } from 'src/app/store/time-offset';
import { Duration, MINUTES, SECONDS } from 'src/app/utils/duration';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { Dialog } from '@angular/cdk/dialog';
import { TimeLimitedContentEndComponent } from 'src/app/containers/time-limited-content-end/time-limited-content-end.component';

/**
 * Select the current result, will be`null` if we know for sure there is no current result and `undefined` if it is not known yet.
 */
const selectCurrentResult = createSelector(
  fromItemContent.selectActiveContentResultsState,
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
  imports: [ DurationAsCountdownPipe ],
  templateUrl: './time-limited-content-info.component.html',
  styleUrl: './time-limited-content-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeLimitedContentInfoComponent {
  private dialogService = inject(Dialog);

  private timerEnded = new Subject<void>();
  timeRemaining = toSignal(
    this.store.select(selectAllowsSubmissionsUntil).pipe(
      filter(isNotUndefined), // still use the previous state when we don't know about the new one
      switchMap(submissionUntil => {
        if (!submissionUntil) return of(null);
        const timeRemaining = Duration.fromNowUntil(submissionUntil);
        if (timeRemaining.getMs() === 0) return of(null); // it is already over, do not show any countdown
        const refreshingRate = timeRemaining.getMs() < 5*MINUTES ? 0.2*SECONDS : 1*SECONDS;
        return interval(refreshingRate).pipe(
          takeUntil(this.timerEnded),
          switchMap(() => this.store.select(fromTimeOffset.selectCurrentTimeOffset).pipe(take(1))),
          map(offset => Duration.fromNowUntil(submissionUntil, new Date(Date.now() - offset))),
        );
      }),
    ), { initialValue: null }
  );

  openModalEffect = effect(() => {
    if (this.timeRemaining()?.getMs() === 0) {
      this.dialogService.open(TimeLimitedContentEndComponent, { disableClose: true, autoFocus: undefined });
      this.timerEnded.next();
    }
  });

  constructor(
    private store: Store
  ) {}

}

