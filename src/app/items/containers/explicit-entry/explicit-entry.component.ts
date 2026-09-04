import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { IsTeamActivityPipe } from '../../models/team-activity';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { switchMap } from 'rxjs';
import { CanEnterNowPipe, HasAlreadyStatedPipe } from '../../models/item-entry';
import { FullItemRoute, isRouteWithParentAttempt, routeWithSelfAttempt } from 'src/app/models/routing/item-route';
import { ItemRouter } from 'src/app/models/routing/item-router';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-explicit-entry',
  imports: [
    IsTeamActivityPipe,
    CanEnterNowPipe,
    HasAlreadyStatedPipe,
    ButtonComponent,
  ],
  templateUrl: './explicit-entry.component.html',
  styleUrl: './explicit-entry.component.scss',
})
export class ExplicitEntryComponent {
  private itemEntryService = inject(ItemEntryService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private itemRouter = inject(ItemRouter);
  private destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();
  itemRefreshRequired = output();

  private entryStateState$ = toObservable(this.itemData).pipe(
    switchMap(({ item: { id } }) => this.itemEntryService.getEntryState(id)),
    mapToFetchState(),
  );
  entryStateState = toSignal(this.entryStateState$, { requireSync: true });

  enterActivityInProgress = signal(false);

  enterActivity(route: FullItemRoute): void {
    if (!isRouteWithParentAttempt(route)) {
      this.actionFeedbackService.error($localize`Unable to enter this activity`);
      return;
    }

    this.enterActivityInProgress.set(true);
    this.itemEntryService.enter(route).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: resp => {
        const message = resp.duration !== null ?
          $localize`You have entered this activity. You have ${resp.duration.toReadable()} left.`:
          $localize`You have entered this activity.`;
        this.actionFeedbackService.success(message);
        // Also refresh: item fetch is keyed only on id/observedGroup, so an attempt-only URL change would not refetch.
        this.itemRouter.navigateTo(routeWithSelfAttempt(route, resp.attemptId), { useCurrentObservation: true });
        this.itemRefreshRequired.emit();
        // Keep in-progress true: this view is torn down on navigation/re-render; resetting would allow double-enter.
      },
      error: _err => {
        this.actionFeedbackService.error($localize`Unable to enter this activity`);
        this.enterActivityInProgress.set(false);
      }
    });
  }

}
