import { Component, Input, OnChanges, Output, EventEmitter, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService, isVisibleItemChild } from '../../../data-access/get-item-children.service';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, share, switchMap } from 'rxjs/operators';
import { isASkill, isSkill, ItemType, ItemTypeCategory } from 'src/app/models/item-type';
import { bestAttemptFromResults } from 'src/app/models/attempts';
import { OverlayPanel } from 'primeng/overlaypanel';
import { mapToFetchState, readyData } from 'src/app/utils/operators/state';
import { FetchState } from 'src/app/utils/state';
import { ItemCorePerm } from 'src/app/models/item-permissions';
import { ErrorComponent } from 'src/app/ui-components/error/error.component';
import { LoadingComponent } from 'src/app/ui-components/loading/loading.component';
import { ItemChildrenEditListComponent } from '../item-children-edit-list/item-children-edit-list.component';
import { SectionComponent } from 'src/app/ui-components/section/section.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { ItemPermPropagations } from 'src/app/models/item-perm-propagation';

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
  standalone: true,
  imports: [ NgIf, SectionComponent, ItemChildrenEditListComponent, LoadingComponent, ErrorComponent, AsyncPipe ]
})
export class ItemChildrenEditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() itemData?: ItemData;

  @ViewChild('op') op?: OverlayPanel;

  activities: PossiblyInvisibleChildData[] = [];
  skills: PossiblyInvisibleChildData[] = [];

  private subscription?: Subscription;
  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  private readonly params$ = new ReplaySubject<{ id: string, attemptId: string }>(1);
  private readonly refresh$ = new Subject<void>();
  readonly state$: Observable<FetchState<PossiblyInvisibleChildData[]>> = this.params$.pipe(
    distinctUntilChanged((a, b) => a.id === b.id && a.attemptId === b.attemptId),
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

  constructor(
    private getItemChildrenService: GetItemChildrenService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.state$.pipe(readyData()).subscribe(data => {
      this.skills = data.filter(item => isASkill(item));
      this.activities = data.filter(item => !isASkill(item));
    });
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
    this.params$.complete();
    this.subscription?.unsubscribe();
  }

  ngOnChanges(): void {
    if (this.itemData?.currentResult) {
      this.params$.next({
        id: this.itemData.item.id,
        attemptId: this.itemData.currentResult.attemptId,
      });
    }
  }

  reloadData(): void {
    this.refresh$.next();
  }

  reset(): void {
    this.reloadData();
  }

  onDataChange(children: PossiblyInvisibleChildData[], type: ItemTypeCategory = 'activity'): void {
    if (isSkill(type)) {
      this.skills = children;
    } else {
      this.activities = children;
    }
    this.childrenChanges.emit([ ...this.skills, ...this.activities ]);
  }
}
