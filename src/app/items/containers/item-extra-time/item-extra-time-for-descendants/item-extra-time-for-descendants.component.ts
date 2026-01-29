import { ChangeDetectionStrategy, Component, input, OnDestroy, signal, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, Subject, switchMap } from 'rxjs';
import { ExtraTimeService } from 'src/app/items/data-access/extra-time.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { ReactiveFormsModule } from '@angular/forms';
import {
  ItemExtraTimeInputComponent
} from 'src/app/items/containers/item-extra-time/item-extra-time-input/item-extra-time-input.component';
import { SetExtraTimeService } from 'src/app/items/data-access/set-extra-time.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRow,
  CdkRowDef,
  CdkTable
} from '@angular/cdk/table';

/**
 * Display extra time given to group descendants on the given item.
 * This component assumes the parent component has validated that the request is valid.
 */
@Component({
  selector: 'alg-item-extra-time-for-descendants',
  imports: [
    ErrorComponent,
    LoadingComponent,
    ReactiveFormsModule,
    ItemExtraTimeInputComponent,
    CdkTable,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkCell,
    CdkCellDef,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CdkNoDataRow,
  ],
  templateUrl: './item-extra-time-for-descendants.component.html',
  styleUrl: './item-extra-time-for-descendants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemExtraTimeForDescendantsComponent implements OnDestroy {
  private extraTimeService = inject(ExtraTimeService);
  private setExtraTimeService = inject(SetExtraTimeService);
  private actionFeedbackService = inject(ActionFeedbackService);

  itemId = input.required<string>();
  groupId = input.required<string>();

  private refreshSubject = new Subject<void>();

  private state$ = combineLatest([ toObservable(this.itemId), toObservable(this.groupId) ]).pipe(
    switchMap(([ itemId, groupId ]) => this.extraTimeService.getForGroupDescendant(itemId, groupId)),
    mapToFetchState({ resetter: this.refreshSubject }),
  );
  stateSignal = toSignal(this.state$, { requireSync: true });
  updating = signal(false);
  displayedColumns = signal([ 'name', 'additionalTime', 'totalAdditionalTime' ]);

  ngOnDestroy(): void {
    this.refreshSubject.complete();
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  onExtraTimeSave(additionalTime: number, groupId: string): void {
    this.updating.set(true);
    this.setExtraTimeService.set(this.itemId(), groupId, additionalTime).subscribe({
      next: () => {
        this.refreshSubject.next(undefined);
        this.updating.set(false);
        this.actionFeedbackService.success($localize`This participant's extra time has been successfully updated`);
      },
      error: () => {
        this.updating.set(false);
        this.actionFeedbackService.unexpectedError();
      },
    });
  }
}
