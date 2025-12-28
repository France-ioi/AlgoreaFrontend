import { ChangeDetectionStrategy, Component, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { ItemData } from '../../models/item-data';
import { CanCurrentUserSetExtraTimePipe, IsTimeLimitedActivityPipe } from '../../models/time-limited-activity';
import { DurationToReadablePipe } from 'src/app/pipes/duration';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemExtraTimeForDescendantsComponent } from './item-extra-time-for-descendants/item-extra-time-for-descendants.component';
import {
  ItemExtraTimeInputComponent
} from 'src/app/items/containers/item-extra-time/item-extra-time-input/item-extra-time-input.component';
import { ItemGetExtraTimeService } from 'src/app/items/data-access/item-get-extra-time.service';
import { combineLatest, Subject, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { filter } from 'rxjs/operators';
import { SetExtraTimeService } from 'src/app/items/data-access/set-extra-time.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';

@Component({
  selector: 'alg-item-extra-time',
  imports: [
    IsTimeLimitedActivityPipe,
    CanCurrentUserSetExtraTimePipe,
    ItemExtraTimeForDescendantsComponent,
    DurationToReadablePipe,
    GroupIsUserPipe,
    ErrorComponent,
    LoadingComponent,
    ItemExtraTimeInputComponent,
  ],
  templateUrl: './item-extra-time.component.html',
  styleUrl: './item-extra-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemExtraTimeComponent implements OnDestroy {
  @ViewChild(ItemExtraTimeForDescendantsComponent) itemExtraTimeForDescendantsComponent?: ItemExtraTimeForDescendantsComponent;

  itemData = input.required<ItemData>();

  observedGroupInfoSignal = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  private refreshSubject = new Subject<void>();

  private state$ = combineLatest([
    toObservable(this.itemData),
    toObservable(this.observedGroupInfoSignal).pipe(filter(groupInfo => !!groupInfo))
  ]).pipe(
    switchMap(([ itemData, groupInfo ]) =>
      this.itemGetExtraTimeService.getForGroup(itemData.item.id, groupInfo.route.id)
    ),
    mapToFetchState({ resetter: this.refreshSubject }),
  );
  stateSignal = toSignal(this.state$, { requireSync: true });

  updating = signal(false);

  constructor(
    private store: Store,
    private itemGetExtraTimeService: ItemGetExtraTimeService,
    private setExtraTimeService: SetExtraTimeService,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  ngOnDestroy(): void {
    this.refreshSubject.complete();
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  onExtraTimeSave(additionalTime: number, groupId: string): void {
    const extraTimeForDescendantsComponent = this.itemExtraTimeForDescendantsComponent;
    if (!extraTimeForDescendantsComponent) throw new Error('Unexpected: extraTimeForDescendantsComponent');
    this.updating.set(true);
    this.setExtraTimeService.set(this.itemData().item.id, groupId, additionalTime).subscribe({
      next: () => {
        this.refresh();
        extraTimeForDescendantsComponent.refresh();
        this.updating.set(false);
        this.actionFeedbackService.success($localize`This group's extra time has been successfully updated`);
      },
      error: () => {
        this.updating.set(false);
        this.actionFeedbackService.unexpectedError();
      },
    });
  }
}
