import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { GetItemChildrenService } from 'src/app/data-access/get-item-children.service';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { EmptyContentComponent } from 'src/app/ui-components/empty-content/empty-content.component';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';
import { ItemData } from '../../models/item-data';
import { taskStatDescriptors } from '../../models/task-stats';
import { ChapterStatsRowComponent } from './chapter-stats-row.component';

@Component({
  selector: 'alg-chapter-stats',
  templateUrl: './chapter-stats.component.html',
  styleUrls: [ './chapter-stats.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    LoadingComponent,
    ErrorComponent,
    EmptyContentComponent,
    TooltipDirective,
    ChapterStatsRowComponent,
  ],
})
export class ChapterStatsComponent {
  private getItemChildrenService = inject(GetItemChildrenService);

  readonly itemData = input.required<ItemData>();

  readonly columns = taskStatDescriptors;
  // computed() memoizes the array so the reference is stable across change-detection passes
  // and only changes when itemData changes; this avoids needless OnPush input churn on child rows.
  readonly parentPath = computed(() => [ ...this.itemData().route.path, this.itemData().item.id ]);
  readonly parentAttemptId = computed(() => this.itemData().currentResult?.attemptId);

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  private readonly params$ = toObservable(this.itemData).pipe(
    map(itemData => (itemData.currentResult
      ? { id: itemData.item.id, attemptId: itemData.currentResult.attemptId }
      : undefined)),
    filter((params): params is { id: string, attemptId: string } => !!params),
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
  );

  readonly state$ = this.params$.pipe(
    switchMap(({ id, attemptId }) => this.getItemChildrenService.get(id, attemptId)),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
