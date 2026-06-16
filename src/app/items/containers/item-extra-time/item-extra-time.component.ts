import { Component, DestroyRef, signal, viewChild, inject } from '@angular/core';
import { CanCurrentUserSetExtraTimePipe, IsTimeLimitedActivityPipe } from '../../models/time-limited-activity';
import { DurationToReadablePipe } from 'src/app/pipes/duration';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { Store } from '@ngrx/store';
import { fromItemContent } from 'src/app/items/store';
import { fromObservation } from 'src/app/store/observation';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { GroupIsUserPipe } from 'src/app/pipes/groupIsUser';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemExtraTimeForDescendantsComponent } from './item-extra-time-for-descendants/item-extra-time-for-descendants.component';
import {
  ItemExtraTimeInputComponent
} from 'src/app/items/containers/item-extra-time/item-extra-time-input/item-extra-time-input.component';
import { ItemGetExtraTimeService } from 'src/app/items/data-access/item-get-extra-time.service';
import { combineLatest, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
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
})
export class ItemExtraTimeComponent {
  private store = inject(Store);
  private itemGetExtraTimeService = inject(ItemGetExtraTimeService);
  private setExtraTimeService = inject(SetExtraTimeService);
  private actionFeedbackService = inject(ActionFeedbackService);
  private readonly destroyRef = inject(DestroyRef);

  readonly itemExtraTimeForDescendantsComponent = viewChild(ItemExtraTimeForDescendantsComponent);

  protected readonly item = this.store.selectSignal(fromItemContent.selectActiveContentItem);

  observedGroupInfoSignal = this.store.selectSignal(fromObservation.selectObservedGroupInfo);

  private refreshSubject = new Subject<void>();

  private state$ = combineLatest([
    toObservable(this.item).pipe(filter(isNotNull)),
    toObservable(this.observedGroupInfoSignal).pipe(filter(groupInfo => !!groupInfo))
  ]).pipe(
    switchMap(([ item, groupInfo ]) =>
      this.itemGetExtraTimeService.getForGroup(item.id, groupInfo.route.id)
    ),
    mapToFetchState({ resetter: this.refreshSubject }),
  );
  stateSignal = toSignal(this.state$, { requireSync: true });

  updating = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => this.refreshSubject.complete());
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  onExtraTimeSave(additionalTime: number, groupId: string): void {
    const activeItem = this.item();
    if (!activeItem) return;
    const extraTimeForDescendantsComponent = this.itemExtraTimeForDescendantsComponent();
    if (!extraTimeForDescendantsComponent) throw new Error('Unexpected: extraTimeForDescendantsComponent');
    this.updating.set(true);
    this.setExtraTimeService.set(activeItem.id, groupId, additionalTime).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
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
