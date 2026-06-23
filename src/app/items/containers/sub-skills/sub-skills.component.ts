import { Component, DestroyRef, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { isASkill } from 'src/app/items/models/item-type';
import { GetItemChildrenService } from '../../../data-access/get-item-children.service';
import { ItemData } from '../../models/item-data';
import { mapToFetchState } from 'src/app/utils/operators/state';
import { canCurrentUserViewContent } from 'src/app/items/models/item-view-permission';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemChildrenListComponent } from '../item-children-list/item-children-list.component';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'alg-sub-skills',
  templateUrl: './sub-skills.component.html',
  styleUrl: './sub-skills.component.scss',
  imports: [ LoadingComponent, ErrorComponent, ItemChildrenListComponent, AsyncPipe ]
})
export class SubSkillsComponent {
  private getItemChildrenService = inject(GetItemChildrenService);

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
    switchMap(({ id, attemptId }) => this.getItemChildrenService.get(id, attemptId)),
    map(children => {
      const newChildren = children
        .map(child => {
          const res = bestAttemptFromResults(child.results);
          return {
            ...child,
            isLocked: !canCurrentUserViewContent(child),
            result: res === null ? undefined : {
              attemptId: res.attemptId,
              validated: res.validated,
              score: res.scoreComputed,
            },
          };
        });
      return {
        skills: newChildren.filter(child => isASkill(child)),
        activities: newChildren.filter(child => !isASkill(child)),
      };
    }),
    mapToFetchState({ resetter: this.refresh$ }),
  );

  refresh(): void {
    this.refresh$.next();
  }
}
