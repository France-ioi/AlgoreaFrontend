import { Component, Input, OnChanges, Output, EventEmitter, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService, isVisibleItemChild } from '../../http-services/get-item-children.service';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, share, switchMap } from 'rxjs/operators';
import { ItemType, typeCategoryOfItem } from '../../../../shared/helpers/item-type';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { bestAttemptFromResults } from '../../../../shared/helpers/attempts';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { OverlayPanel } from 'primeng/overlaypanel';
import { mapToFetchState, readyData } from '../../../../shared/operators/state';
import { FetchState } from '../../../../shared/helpers/state';
import { itemViewPermMax } from 'src/app/shared/models/domain/item-view-permission';
import { allowsGrantingView, itemGrantViewPermMax } from 'src/app/shared/models/domain/item-grant-view-permission';
import { itemWatchPermMax } from 'src/app/shared/models/domain/item-watch-permission';
import { ItemCorePerm } from 'src/app/shared/models/domain/item-permissions';
import { itemEditPermMax } from 'src/app/shared/models/domain/item-edit-permission';

interface BaseChildData {
  contentViewPropagation?: 'none' | 'as_info' | 'as_content',
  editPropagation?: boolean,
  grantViewPropagation?: boolean,
  upperViewLevelsPropagation?: 'use_content_view_propagation' | 'as_content_with_descendants' | 'as_is',
  scoreWeight: number,
  watchPropagation?: boolean,
  permissions?: ItemCorePerm,
}
interface InvisibleChildData extends BaseChildData {
  id: string,
  isVisible: false,
}
interface ChildData extends BaseChildData {
  id?: string,
  isVisible: true,
  title: string | null,
  type: ItemType,
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
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() itemData?: ItemData;

  @ViewChild('op') op?: OverlayPanel;

  data: PossiblyInvisibleChildData[] = [];
  selectedRows: PossiblyInvisibleChildData[] = [];
  scoreWeightEnabled = false;
  addedItemIds: string[] = [];
  propagationEditItemIdx?: number;

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
        };

        if (isVisibleItemChild(child)) {
          const res = bestAttemptFromResults(child.results);
          return {
            ...baseChildData,
            id: child.id,
            title: child.string.title,
            type: child.type,
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
    private itemRouter: ItemRouter,
  ) {}

  ngOnInit(): void {
    this.subscription = this.state$.pipe(readyData()).subscribe(data => {
      this.data = data;
      this.scoreWeightEnabled = this.data.some(c => c.scoreWeight !== 1);
      this.onChildrenListUpdate();
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

  addChild(child: AddedContent<ItemType>): void {
    const permissionsForCreatedItem: ItemCorePerm = {
      canView: itemViewPermMax,
      canWatch: itemWatchPermMax,
      canEdit: itemEditPermMax,
      canGrantView: itemGrantViewPermMax,
      isOwner: true,
    };

    this.data.push({
      ...child,
      scoreWeight: DEFAULT_SCORE_WEIGHT,
      isVisible: true,
      contentViewPropagation: !allowsGrantingView(child.permissions ?? permissionsForCreatedItem) ? 'none' : 'as_info',
      permissions: child.permissions ?? permissionsForCreatedItem,
    });
    this.onChildrenListUpdate();
    this.childrenChanges.emit(this.data);
  }

  onSelectAll(): void {
    this.selectedRows = this.selectedRows.length === this.data.length ? [] : this.data;
  }

  onRemove(): void {
    this.data = this.data.filter(elm => !this.selectedRows.includes(elm));
    this.onChildrenListUpdate();
    this.childrenChanges.emit(this.data);
    this.selectedRows = [];
  }

  orderChanged(): void {
    this.childrenChanges.emit(this.data);
  }

  reset(): void {
    this.reloadData();
  }

  onEnableScoreWeightChange(event: boolean): void {
    if (!event) {
      this.resetScoreWeight();
    }
  }

  resetScoreWeight(): void {
    this.data = this.data.map(c => ({ ...c, scoreWeight: DEFAULT_SCORE_WEIGHT }));
    this.onChildrenListUpdate();
    this.onScoreWeightChange();
  }

  onScoreWeightChange(): void {
    this.childrenChanges.emit(this.data);
  }

  openPropagationEditMenu(event: MouseEvent, actualTarget: HTMLDivElement, itemIdx: number): void {
    this.propagationEditItemIdx = itemIdx;
    this.op?.toggle(event, actualTarget);
  }

  onContentViewPropagationChanged(contentViewPropagation: 'none' | 'as_info' | 'as_content'): void {
    this.op?.hide();
    this.data = this.data.map((c, index) => {
      if (index === this.propagationEditItemIdx) {
        return {
          ...c,
          contentViewPropagation,
        };
      }
      return c;
    });
    this.propagationEditItemIdx = undefined;
    this.childrenChanges.emit(this.data);
  }

  private onChildrenListUpdate(): void {
    this.recomputeAddedItemIds();
  }

  private recomputeAddedItemIds(): void {
    this.addedItemIds = this.data.map(item => item.id).filter(isNotUndefined);
  }

  onClick(child: PossiblyInvisibleChildData): void {
    if (!this.itemData || !child.id || !child.isVisible) {
      return;
    }

    const attemptId = child.result?.attemptId;
    const parentAttemptId = this.itemData.currentResult?.attemptId;

    // unexpected: children have been loaded, so we are sure this item has an attempt
    if (!parentAttemptId) {
      return;
    }

    this.itemRouter.navigateTo({
      contentType: typeCategoryOfItem(child),
      id: child.id,
      path: this.itemData.route.path.concat([ this.itemData.item.id ]),
      ...attemptId ? { attemptId: attemptId } : { parentAttemptId: parentAttemptId }
    });
  }
}
