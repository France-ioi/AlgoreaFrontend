import { ChangeDetectionStrategy, Component, input, OnDestroy } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { combineLatest, Subject, switchMap } from 'rxjs';
import { ExtraTimeService } from 'src/app/items/data-access/extra-time.service';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { mapToFetchState } from 'src/app/utils/operators/state';

/**
 * Display extra time given to group descendants on the given item.
 * This component assumes the parent component has validated that the request is valid.
 */
@Component({
  selector: 'alg-item-extra-time-for-descendants',
  standalone: true,
  imports: [
    TableModule,
    ErrorComponent,
    LoadingComponent,
  ],
  templateUrl: './item-extra-time-for-descendants.component.html',
  styleUrl: './item-extra-time-for-descendants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemExtraTimeForDescendantsComponent implements OnDestroy {
  itemId = input.required<string>();
  groupId = input.required<string>();

  private refreshSubject = new Subject<void>();

  private state$ = combineLatest([ toObservable(this.itemId), toObservable(this.groupId) ]).pipe(
    switchMap(([ itemId, groupId ]) => this.extraTimeService.getForGroupDescendant(itemId, groupId)),
    mapToFetchState({ resetter: this.refreshSubject }),
  );
  stateSignal = toSignal(this.state$, { requireSync: true });

  constructor(
    private extraTimeService: ExtraTimeService,
  ){}

  ngOnDestroy(): void {
    this.refreshSubject.complete();
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

}
