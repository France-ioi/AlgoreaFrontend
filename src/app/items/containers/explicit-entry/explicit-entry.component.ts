import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ItemData } from '../../models/item-data';
import { isTeamActivity } from '../../models/team-activity';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { switchMap } from 'rxjs';
import { CanEnterNowPipe, HasAlreadyStatedPipe, hasAlreadyStated } from '../../models/item-entry';
import { FullItemRoute, isRouteWithParentAttempt, itemRouteWith, newAttemptId } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Store } from '@ngrx/store';
import { fromItemContent } from '../../store';
import { Result } from '../../models/attempts';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { AttemptActionsService } from 'src/app/data-access/attempt-actions.service';
import { canCurrentUserViewContent } from '../../models/item-view-permission';
import { canCurrentUserEditChildren } from '../../models/item-edit-permission';
import { isAChapter, isATask, isAnActivity } from '../../models/item-type';
import { isTimeLimitedActivity } from '../../models/time-limited-activity';

@Component({
  selector: 'alg-explicit-entry',
  imports: [
    CanEnterNowPipe,
    HasAlreadyStatedPipe,
    ButtonComponent,
    RouterLink,
  ],
  templateUrl: './explicit-entry.component.html',
  styleUrl: './explicit-entry.component.scss',
})
export class ExplicitEntryComponent {
  private itemEntryService = inject(ItemEntryService);
  private attemptActions = inject(AttemptActionsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private itemRouter = inject(ItemRouter);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();
  itemRefreshRequired = output();

  private entryStateState$ = toObservable(this.itemData).pipe(
    switchMap(({ item: { id } }) => this.itemEntryService.getEntryState(id)),
    mapToFetchState(),
  );
  entryStateState = toSignal(this.entryStateState$, { requireSync: true });

  actionInProgress = signal(false);

  protected readonly newAttemptRequested = computed(() => this.itemData().route.attemptId === newAttemptId);
  protected readonly attemptsTabLink = computed(() => this.itemRouter.url(this.itemData().route, [ 'attempts' ]));

  protected readonly canViewContent = computed(() => canCurrentUserViewContent(this.itemData().item));

  /** Content viewers on Task/Chapter may use the direct-start path (independent of entry state). */
  protected readonly canStartDirectlyBase = computed(() => {
    const item = this.itemData().item;
    return this.canViewContent() && (isATask(item) || isAChapter(item));
  });

  protected readonly alreadyStarted = computed(() => {
    const state = this.entryStateState();
    return state.isReady && hasAlreadyStated(state.data);
  });

  /**
   * Show the Start button when direct-start applies, except hide it for single-attempt items that are
   * already started (those users need the already_started advice instead).
   */
  protected readonly canStartDirectly = computed(() => {
    if (!this.canStartDirectlyBase()) return false;
    return !this.alreadyStarted() || this.itemData().item.allowsMultipleAttempts;
  });

  /**
   * Regular entry-state UI: info-only / Skill / non-task-chapter fallback, multi-attempt owners, or
   * already_started single-attempt content viewers (so attempts-tab / refresh advice is not lost).
   */
  protected readonly showRegularEntry = computed(() =>
    !this.canStartDirectlyBase() || this.itemData().item.allowsMultipleAttempts || this.alreadyStarted()
  );

  protected readonly isTimeLimited = computed(() => isTimeLimitedActivity(this.itemData().item));

  protected readonly canEditChildren = computed(() => canCurrentUserEditChildren(this.itemData().item));

  /** Safe for Skills: `isTeamActivity` throws on non-activities. */
  protected readonly isTeamActivityItem = computed(() => {
    const item = this.itemData().item;
    return isAnActivity(item) && isTeamActivity(item);
  });

  startDirectly(route: FullItemRoute): void {
    if (!isRouteWithParentAttempt(route)) {
      this.actionFeedbackService.error($localize`Unable to start this activity`);
      return;
    }

    this.actionInProgress.set(true);
    this.attemptActions.create(route.path.concat([ route.id ]), route.parentAttemptId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: attemptId => {
        const now = new Date();
        // POST /attempts ignores entering conditions and does not set allows_submissions_until
        // (infinite window) — matching the "without time constraints" button label.
        this.onAttemptStarted(route, {
          attemptId,
          startedAt: now,
          endedAt: null,
          latestActivityAt: now,
          score: 0,
          validated: false,
          allowsSubmissionsUntil: new Date(backendInfiniteDateString),
        });
      },
      error: () => {
        this.actionFeedbackService.error($localize`Unable to start this activity`);
        this.actionInProgress.set(false);
      },
    });
  }

  enterActivity(route: FullItemRoute): void {
    if (!isRouteWithParentAttempt(route)) {
      this.actionFeedbackService.error($localize`Unable to enter this activity`);
      return;
    }

    this.actionInProgress.set(true);
    this.itemEntryService.enter(route).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: resp => {
        const message = resp.duration !== null ?
          $localize`You have entered this activity. You have ${resp.duration.toReadable()} left.`:
          $localize`You have entered this activity.`;
        this.actionFeedbackService.success(message);
        // `/enter` returns only attempt_id/duration/entered_at — synthesize a provisional Result so
        // `currentResult` is non-null as soon as we navigate to `a=NEW` (avoids flashing the Enter button).
        this.onAttemptStarted(route, {
          attemptId: resp.attemptId,
          startedAt: resp.enteredAt,
          endedAt: null,
          latestActivityAt: resp.enteredAt,
          score: 0,
          validated: false,
          allowsSubmissionsUntil: resp.duration !== null
            ? new Date(resp.enteredAt.getTime() + resp.duration.getMs())
            : new Date(backendInfiniteDateString),
        });
      },
      error: _err => {
        this.actionFeedbackService.error($localize`Unable to enter this activity`);
        this.actionInProgress.set(false);
      }
    });
  }

  private onAttemptStarted(route: FullItemRoute, result: Result): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.attemptStarted({ result }));
    this.itemRouter.navigateTo(
      itemRouteWith(route, { attemptId: result.attemptId }),
      { useCurrentObservation: true },
    );
    this.itemRefreshRequired.emit();
    // Keep in-progress true: this view is torn down on navigation/re-render; resetting would allow double-submit.
  }

}
