import { Component, computed, DestroyRef, inject } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { GetGroupByIdService } from 'src/app/groups/data-access/get-group-by-id.service';
import { ItemData } from '../../models/item-data';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { isNotNull } from 'src/app/utils/null-undefined-predicates';
import { Subject } from 'rxjs';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components//loading/loading.component';
import { GroupProgressGridComponent } from '../group-progress-grid/group-progress-grid.component';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { fromObservation } from 'src/app/store/observation';
import { fromItemContent } from 'src/app/items/store';

@Component({
  selector: 'alg-item-group-progress',
  templateUrl: './item-group-progress.component.html',
  styleUrl: './item-group-progress.component.scss',
  imports: [ GroupProgressGridComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ItemGroupProgressComponent {
  private store = inject(Store);
  private getGroupByIdService = inject(GetGroupByIdService);
  private destroyRef = inject(DestroyRef);

  protected readonly item = this.store.selectSignal(fromItemContent.selectActiveContentItem);
  protected readonly route = this.store.selectSignal(fromItemContent.selectActiveContentRoute);
  protected readonly currentResult = this.store.selectSignal(fromItemContent.selectActiveContentCurrentResult);

  protected readonly itemData = computed((): ItemData | undefined => {
    const item = this.item();
    const route = this.route();
    if (!item || !route) {
      return undefined;
    }
    // group-progress-grid only reads route, item, and currentResult — breadcrumbs are unused here.
    return { route, item, breadcrumbs: [], currentResult: this.currentResult() ?? undefined };
  });

  private refresh$ = new Subject<void>();
  state$ = this.store.select(fromObservation.selectObservedGroupId).pipe(
    filter(isNotNull),
    switchMap(observedGroupId => this.getGroupByIdService.get(observedGroupId)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.refresh$.complete());
  }

  refresh(): void {
    this.refresh$.next();
  }
}
