import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType } from '../../../../shared/helpers/item-type';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { Router } from '@angular/router';

export interface ChildData {
  id?: string,
  title: string | null,
  type: ItemType,
  scoreWeight: number,
}

export interface ChildDataWithId extends ChildData{
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

  private subscription?: Subscription;
  @Output() childrenChanges = new EventEmitter<ChildData[]>();

  constructor(
    private getItemChildrenService: GetItemChildrenService,
    private router: Router,
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
            .map(child => ({
              id: child.id,
              title: child.string.title,
              type: child.type,
              scoreWeight: child.scoreWeight
            }))
          )
        ).subscribe(children => {
          this.data = children;
          this.scoreWeightEnabled = this.data.some(c => c.scoreWeight !== 1);
          this.state = 'ready';
        },
        _err => {
          this.state = 'error';
        });
    } else {
      this.state = 'error';
    }
  }

  addChild(child: AddedContent<ItemType>): void {
    this.data.push({ ...child, scoreWeight: DEFAULT_SCORE_WEIGHT });
    this.childrenChanges.emit(this.data);
  }

  onSelectAll(): void {
    this.selectedRows = this.selectedRows.length === this.data.length ? [] : this.data;
  }

  onRemove(): void {
    this.data = this.data.filter(elm => !this.selectedRows.includes(elm));
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
    this.onScoreWeightChange();
  }

  onScoreWeightChange(): void {
    this.childrenChanges.emit(this.data);
  }

  onClick(data: ChildData): void {
    void this.router.navigate([ '/' ]);
  }
}
