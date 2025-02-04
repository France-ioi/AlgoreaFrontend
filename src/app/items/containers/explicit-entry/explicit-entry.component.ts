import { ChangeDetectionStrategy, Component, OnDestroy, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { IsTeamActivityPipe } from '../../models/team-activity';
import { ItemEntryService } from '../../data-access/item-entry.service';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { Subscription, switchMap } from 'rxjs';
import { CanEnterNowPipe, HasAlreadyStatedPipe } from '../../models/item-entry';
import { ItemRoute } from 'src/app/models/routing/item-route';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-explicit-entry',
  standalone: true,
  imports: [
    IsTeamActivityPipe,
    CanEnterNowPipe,
    HasAlreadyStatedPipe,
    ButtonComponent,
  ],
  templateUrl: './explicit-entry.component.html',
  styleUrl: './explicit-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplicitEntryComponent implements OnDestroy {
  itemData = input.required<ItemData>();
  itemRefreshRequired = output();

  private entryStateState$ = toObservable(this.itemData).pipe(
    switchMap(({ item: { id } }) => this.itemEntryService.getEntryState(id)),
    mapToFetchState(),
  );
  entryStateState = toSignal(this.entryStateState$, { requireSync: true });

  enterActivityInProgress = signal(false);

  private subscription?: Subscription;

  constructor(
    private itemEntryService: ItemEntryService,
    private actionFeedbackService: ActionFeedbackService,
  ){}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  enterActivity(route: ItemRoute): void {
    this.enterActivityInProgress.set(true);
    this.subscription = this.itemEntryService.enter(route).subscribe({
      next: resp => {
        const message = resp.duration !== null ?
          $localize`You have entered this activity. You have ${resp.duration.toReadable()} left.`:
          $localize`You have entered this activity.`;
        this.actionFeedbackService.success(message);
        this.itemRefreshRequired.emit();
        this.enterActivityInProgress.set(false);
      },
      error: _err => {
        this.actionFeedbackService.error($localize`Unable to enter this activity`);
        this.enterActivityInProgress.set(false);
      }
    });
  }

}
