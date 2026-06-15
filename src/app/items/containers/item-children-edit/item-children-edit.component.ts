import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ItemData } from '../../models/item-data';
import { GetItemChildrenService, isVisibleItemChild } from '../../../data-access/get-item-children.service';
import { Observable, Subject } from 'rxjs';
import { filter, map, share, switchMap } from 'rxjs/operators';
import { isASkill, ItemType, ItemTypeCategory, itemTypeCategoryEnum as c } from 'src/app/items/models/item-type';
import { bestAttemptFromResults } from 'src/app/items/models/attempts';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemChildrenEditListComponent } from '../item-children-edit-list/item-children-edit-list.component';
import { AsyncPipe } from '@angular/common';
import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';

type BaseChildData = Partial<ItemPermPropagations> & {
  scoreWeight: number,
  permissions?: ItemCorePerm,
  type: ItemType,
};
interface InvisibleChildData extends BaseChildData {
  id: string,
  isVisible: false,
}
interface ChildData extends BaseChildData {
  id?: string,
  isVisible: true,
  title: string | null,
  url?: string,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
}

export type PossiblyInvisibleChildData = ChildData | InvisibleChildData;

export type ChildDataWithId = InvisibleChildData | (ChildData & { id: string });

export function hasId(child: PossiblyInvisibleChildData): child is ChildDataWithId {
  return !!child.id;
}

export const DEFAULT_SCORE_WEIGHT = 1;

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ],
  imports: [ ItemChildrenEditListComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ItemChildrenEditComponent {
  private getItemChildrenService = inject(GetItemChildrenService);
  private destroyRef = inject(DestroyRef);

  itemData = input.required<ItemData>();
  childrenChanges = output<PossiblyInvisibleChildData[]>();

  activities = signal<PossiblyInvisibleChildData[]>([]);
  skills = signal<PossiblyInvisibleChildData[]>([]);

  private readonly refresh$ = new Subject<void>();

  private readonly params$ = toObservable(this.itemData).pipe(
    map(itemData => (itemData.currentResult
      ? { id: itemData.item.id, attemptId: itemData.currentResult.attemptId }
      : undefined)),
    filter(isNotUndefined),
  );

  readonly state$: Observable<FetchState<PossiblyInvisibleChildData[]>> = this.params$.pipe(
    switchMap(({ id, attemptId }) => this.getItemChildrenService.getWithInvisibleItems(id, attemptId)),
    map(children => children
      .sort((a, b) => a.order - b.order)
      .map((child): PossiblyInvisibleChildData => {
        const baseChildData: BaseChildData = {
          scoreWeight: child.scoreWeight,
          contentViewPropagation: child.contentViewPropagation,
          editPropagation: child.editPropagation,
          grantViewPropagation: child.grantViewPropagation,
          upperViewLevelsPropagation: child.upperViewLevelsPropagation,
          watchPropagation: child.watchPropagation,
          permissions: child.permissions,
          type: child.type,
        };

        if (isVisibleItemChild(child)) {
          const res = bestAttemptFromResults(child.results);
          return {
            ...baseChildData,
            id: child.id,
            title: child.string.title,
            isVisible: true,
            result: res === null ? undefined : {
              attemptId: res.attemptId,
              validated: res.validated,
              score: res.scoreComputed,
            },
          };
        }

        return {
          ...baseChildData,
          id: child.id,
          isVisible: false,
        };
      })
    ),
    mapToFetchState({ resetter: this.refresh$ }),
    share(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.refresh$.complete());

    this.state$.pipe(
      readyData(),
      takeUntilDestroyed(),
    ).subscribe(data => {
      this.skills.set(data.filter(item => isASkill(item)));
      this.activities.set(data.filter(item => !isASkill(item)));
    });
  }

  reloadData(): void {
    this.refresh$.next();
  }

  reset(): void {
    this.reloadData();
  }

  onDataChange(children: PossiblyInvisibleChildData[], type: ItemTypeCategory = c.activity): void {
    if (type === c.skill) {
      this.skills.set(children);
    } else {
      this.activities.set(children);
    }
    this.childrenChanges.emit([ ...this.skills(), ...this.activities() ]);
  }
}
