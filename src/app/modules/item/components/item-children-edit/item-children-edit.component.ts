import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType, typeCategoryOfItem } from '../../../../shared/helpers/item-type';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { ItemRouter } from '../../../../shared/routing/item-router';
import { bestAttemptFromResults } from '../../../../shared/helpers/attempts';
import { canCurrentUserViewItemContent } from '../../helpers/item-permissions';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';

export interface ChildData {
  id?: string,
  title: string | null,
  type: ItemType,
  scoreWeight: number,
  result?: {
    attemptId: string,
    validated: boolean,
    score: number,
  },
  contentViewPropagation?: 'none' | 'as_info' | 'as_content',
  editPropagation?: boolean,
  grantViewPropagation?: boolean,
  upperViewLevelsPropagation?: 'use_content_view_propagation' | 'as_content_with_descendants' | 'as_is',
  watchPropagation?: boolean,
}

export interface ChildDataWithId extends ChildData {
  id: string;
}

export function hasId(child: ChildData): child is ChildDataWithId {
  return !!child.id;
}

export const DEFAULT_SCORE_WEIGHT = 1;

@Component({
  selector: 'alg-item-children-edit',
  templateUrl: './item-children-edit.component.html',
  styleUrls: [ './item-children-edit.component.scss' ]
})
export class ItemChildrenEditComponent implements OnChanges {
  @Input() itemData?: ItemData;

  state: 'loading' | 'error' | 'ready' = 'ready';
  data: ChildData[] = [];
  selectedRows: ChildData[] = [];
  scoreWeightEnabled = false;
  addedItemIds: string[] = [];

  private subscription?: Subscription;
  @Output() childrenChanges = new EventEmitter<ChildData[]>();

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private itemRouter: ItemRouter,
  ) {}

  ngOnChanges(): void {
    this.reloadData();
  }

  reloadData(): void {
    if (this.itemData?.currentResult) {
      this.state = 'loading';
      this.subscription?.unsubscribe();
      this.subscription = this.getItemChildrenService
        .get(this.itemData.item.id, this.itemData.currentResult.attemptId)
        .pipe(
          map(children => children
            .sort((a, b) => a.order - b.order)
            .map(child => {
              const res = bestAttemptFromResults(child.results);
              return {
                id: child.id,
                title: child.string.title,
                type: child.type,
                scoreWeight: child.scoreWeight,
                isLocked: !canCurrentUserViewItemContent(child),
                result: res === null ? undefined : {
                  attemptId: res.attemptId,
                  validated: res.validated,
                  score: res.scoreComputed,
                },
                contentViewPropagation: child.contentViewPropagation,
                editPropagation: child.editPropagation,
                grantViewPropagation: child.grantViewPropagation,
                upperViewLevelsPropagation: child.upperViewLevelsPropagation,
                watchPropagation: child.watchPropagation,
              };
            })
          )
        ).subscribe({
          next: children => {
            this.data = children;
            this.scoreWeightEnabled = this.data.some(c => c.scoreWeight !== 1);
            this.onChildrenListUpdate();
            this.state = 'ready';
          },
          error: _err => {
            this.state = 'error';
          }
        });
    } else {
      this.state = 'error';
    }
  }

  addChild(child: AddedContent<ItemType>): void {
    this.data.push({ ...child, scoreWeight: DEFAULT_SCORE_WEIGHT });
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

  private onChildrenListUpdate(): void {
    this.recomputeAddedItemIds();
  }

  private recomputeAddedItemIds(): void {
    this.addedItemIds = this.data.map(item => item.id).filter(isNotUndefined);
  }

  onClick(child: ChildData): void {
    if (!this.itemData || !child.id) {
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
