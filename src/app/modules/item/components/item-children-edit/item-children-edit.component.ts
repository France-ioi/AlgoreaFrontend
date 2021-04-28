import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { ItemData } from '../../services/item-datasource.service';
import { GetItemChildrenService } from '../../http-services/get-item-children.service';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemType } from '../../../../shared/helpers/item-type';

export interface ChildData {
  id?: string,
  title: string | null,
  type: ItemType,
  scoreWeight?: number,
}

export interface ChildDataWithId extends ChildData{
  id: string;
}

export function hasId(child: ChildData): child is ChildDataWithId {
  return !!child.id;
}

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
  enableScoreWeight = false;

  private subscription?: Subscription;
  @Output() childrenChanges = new EventEmitter<ChildData[]>();

  constructor(
    private getItemChildrenService: GetItemChildrenService,
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
          this.enableScoreWeight = this.getEnableScoreWeight();
          this.state = 'ready';
        },
        _err => {
          this.state = 'error';
        });
    } else {
      this.state = 'error';
    }
  }

  addChild(child: ChildData): void {
    this.data.push(child);
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

  getEnableScoreWeight(): boolean {
    return this.data.filter(c => c.scoreWeight && c.scoreWeight > 1).length > 1;
  }

  onScoreWeightChange(): void {
    this.childrenChanges.emit(this.data);
  }
}
