import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';
import { AttemptActionsService } from 'src/app/data-access/attempt-actions.service';
import {
  isRouteWithParentAttempt,
  itemRouteWith,
  newAttemptId,
} from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { fromObservation } from 'src/app/store/observation';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { RelativeTimeComponent } from 'src/app/ui-components/relative-time/relative-time.component';
import { ScoreRingComponent } from 'src/app/ui-components/score-ring/score-ring.component';
import { backendInfiniteDateString } from 'src/app/utils/date';
import { canCreateResults, Result } from '../../models/attempts';
import { fromItemContent } from '../../store';
import { AttemptRow, buildAttemptRows } from './attempt-rows';

@Component({
  selector: 'alg-item-attempts',
  host: { class: 'alg-flex-1' },
  templateUrl: './item-attempts.component.html',
  styleUrl: './item-attempts.component.scss',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    ErrorComponent,
    LoadingComponent,
    RelativeTimeComponent,
    ScoreRingComponent,
  ],
})
export class ItemAttemptsComponent {
  private store = inject(Store);
  private itemRouter = inject(ItemRouter);
  private attemptActions = inject(AttemptActionsService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private destroyRef = inject(DestroyRef);

  protected readonly item = this.store.selectSignal(fromItemContent.selectActiveContentItem);
  protected readonly resultsState = this.store.selectSignal(fromItemContent.selectActiveContentResultsState);
  protected readonly route = this.store.selectSignal(fromItemContent.selectActiveContentRoute);
  protected readonly attemptResolution = this.store.selectSignal(fromItemContent.selectAttemptResolution);
  protected readonly isObserving = this.store.selectSignal(fromObservation.selectIsObserving);

  protected readonly createInProgress = signal(false);

  protected readonly rows = computed(() => {
    const results = this.resultsState().data;
    if (!results) return [];
    return buildAttemptRows(results, this.route()?.attemptId);
  });

  protected readonly newAttemptRequested = computed(() => this.route()?.attemptId === newAttemptId);

  protected readonly contentTabLink = computed(() => {
    const route = this.route();
    return route ? this.itemRouter.url(route, []) : null;
  });

  protected readonly canCreate = computed(() => {
    const item = this.item();
    const route = this.route();
    if (!item || !route || !isRouteWithParentAttempt(route)) return false;
    if (this.isObserving() || this.attemptResolution() !== null) return false;
    // Explicit entry is authorized by `GET /items/{id}/entry-state` (checked by alg-explicit-entry on the content
    // tab, which this button navigates to), not by the view permission: an "info"-only item can still be entered.
    // Creating an attempt through the API does require "content".
    return item.requiresExplicitEntry || canCreateResults(item);
  });

  protected selectAttemptAriaLabel(number: number): string {
    return $localize`Select attempt ${ number }:number:`;
  }

  protected selectAttempt(row: AttemptRow): void {
    const route = this.route();
    if (!route) return;
    this.itemRouter.navigateTo(
      itemRouteWith(route, { attemptId: row.result.attemptId }),
      { useCurrentObservation: true },
    );
  }

  protected requestNewAttempt(): void {
    const route = this.route();
    if (!route) return;
    this.itemRouter.navigateTo(
      itemRouteWith(route, { attemptId: newAttemptId }),
      {
        page: [],
        useCurrentObservation: true,
        navExtras: { replaceUrl: true },
      },
    );
  }

  protected createAttempt(): void {
    const route = this.route();
    const item = this.item();
    if (!route || !item || !isRouteWithParentAttempt(route) || this.createInProgress()) return;
    if (this.isObserving() || this.attemptResolution() !== null || !canCreateResults(item)) return;

    this.createInProgress.set(true);
    this.attemptActions.create(route.path.concat([ route.id ]), route.parentAttemptId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.createInProgress.set(false)),
    ).subscribe({
      next: attemptId => {
        const now = new Date();
        const provisionalResult: Result = {
          attemptId,
          startedAt: now,
          endedAt: null,
          latestActivityAt: now,
          score: 0,
          validated: false,
          allowsSubmissionsUntil: item.duration !== null
            ? new Date(now.getTime() + item.duration.getMs())
            : new Date(backendInfiniteDateString),
        };
        this.store.dispatch(fromItemContent.itemByIdPageActions.attemptStarted({ result: provisionalResult }));
        this.itemRouter.navigateTo(
          itemRouteWith(route, { attemptId }),
          { useCurrentObservation: true },
        );
      },
      error: () => {
        this.actionFeedbackService.error($localize`Unable to create a new attempt`);
      },
    });
  }

  protected refresh(): void {
    this.store.dispatch(fromItemContent.itemByIdPageActions.refresh());
  }
}
