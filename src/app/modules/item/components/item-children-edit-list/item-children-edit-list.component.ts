import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DEFAULT_SCORE_WEIGHT, PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from '../../../../shared/helpers/item-type';
import { ItemCorePerm } from '../../../../shared/models/domain/item-permissions';
import { itemViewPermMax } from '../../../../shared/models/domain/item-view-permission';
import { itemWatchPermMax } from '../../../../shared/models/domain/item-watch-permission';
import { itemEditPermMax } from '../../../../shared/models/domain/item-edit-permission';
import { itemGrantViewPermMax } from '../../../../shared/models/domain/item-grant-view-permission';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';

@Component({
  selector: 'alg-item-children-edit-list',
  templateUrl: './item-children-edit-list.component.html',
  styleUrls: [ './item-children-edit-list.component.scss' ],
})
export class ItemChildrenEditListComponent implements OnChanges {
  @Input() type: ItemTypeCategory = 'activity';
  @Input() data: PossiblyInvisibleChildData[] = [];
  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();
  @Output() linkClick = new EventEmitter<PossiblyInvisibleChildData>();

  @ViewChild('op') op?: OverlayPanel;

  selectedRows: PossiblyInvisibleChildData[] = [];
  scoreWeightEnabled = false;
  propagationEditItemIdx?: number;
  addedItemIds: string[] = [];

  constructor() {
  }

  ngOnChanges(): void {
    this.addedItemIds = this.data.map(item => item.id).filter(isNotUndefined);
    this.scoreWeightEnabled = this.data.some(c => c.scoreWeight !== 1);
  }

  addChild(child: AddedContent<ItemType>): void {
    const permissionsForCreatedItem: ItemCorePerm = {
      canView: itemViewPermMax,
      canWatch: itemWatchPermMax,
      canEdit: itemEditPermMax,
      canGrantView: itemGrantViewPermMax,
      isOwner: true,
    };
    this.childrenChanges.emit([
      ...this.data,
      {
        ...child,
        scoreWeight: DEFAULT_SCORE_WEIGHT,
        isVisible: true,
        contentViewPropagation: 'none', // default propagation: none so that users cannot see new items before they are ready
        permissions: child.permissions ?? permissionsForCreatedItem,
      }
    ]);
  }

  onSelectAll(): void {
    this.selectedRows = this.selectedRows.length === this.data.length ? [] : this.data;
  }

  onRemove(): void {
    this.childrenChanges.emit(this.data.filter(elm => !this.selectedRows.includes(elm)));
    this.selectedRows = [];
  }

  onEnableScoreWeightChange(event: boolean): void {
    if (!event) {
      this.childrenChanges.emit(this.data.map(c => ({ ...c, scoreWeight: DEFAULT_SCORE_WEIGHT })));
    }
  }

  orderChanged(): void {
    this.childrenChanges.emit(this.data);
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
    this.childrenChanges.emit(this.data.map((c, index) => {
      if (index === this.propagationEditItemIdx) {
        return {
          ...c,
          contentViewPropagation,
        };
      }
      return c;
    }));
    this.propagationEditItemIdx = undefined;
  }

  onClick(child: PossiblyInvisibleChildData): void {
    this.linkClick.emit(child);
  }
}