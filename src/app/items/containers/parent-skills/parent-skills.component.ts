import { Component, DestroyRef, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { GetItemParentsService } from '../../data-access/get-item-parents.service';
import { ItemData } from '../../models/item-data';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'alg-parent-skills',
  templateUrl: './parent-skills.component.html',
  styleUrls: [ './parent-skills.component.scss' ],
  imports: [ LoadingComponent, ErrorComponent, ItemChildrenListComponent, AsyncPipe, SlicePipe ]
})
export class ParentSkillsComponent {
  private getItemParentsService = inject(GetItemParentsService);

  readonly itemData = input.required<ItemData>();

  private readonly refresh$ = new Subject<void>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.refresh$.complete());
  }

  private readonly params$ = toObservable(this.itemData).pipe(
    map(itemData => (itemData.currentResult
      ? { id: itemData.item.id, attemptId: itemData.currentResult.attemptId }
      : undefined)),
    filter(isNotUndefined),
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
  );

  readonly state$ = this.params$.pipe(
    switchMap(({ id, attemptId }) => this.getItemParentsService.get(id, attemptId)),
    map(parents => parents.map(parent => ({
      ...parent,
      isLocked: !canCurrentUserViewContent(parent),
      result: parent.result === null ? undefined : {
        attemptId: parent.result.attemptId,
        validated: parent.result.validated,
        score: parent.result.scoreComputed,
      },
    }))),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
