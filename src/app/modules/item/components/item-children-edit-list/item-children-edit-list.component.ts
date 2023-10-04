import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DEFAULT_SCORE_WEIGHT, PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { AddedContent } from '../../../shared-components/components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from '../../../../shared/helpers/item-type';
import { ItemCorePerm } from '../../../../shared/models/domain/item-permissions';
import { itemViewPermMax } from '../../../../shared/models/domain/item-view-permission';
import { itemWatchPermMax } from '../../../../shared/models/domain/item-watch-permission';
import { itemEditPermMax } from '../../../../shared/models/domain/item-edit-permission';
import { itemGrantViewPermMax } from '../../../../shared/models/domain/item-grant-view-permission';
import { isNotUndefined } from '../../../../shared/helpers/null-undefined-predicates';
import { ItemData } from '../../services/item-datasource.service';
import { RouteUrlPipe } from 'src/app/shared/pipes/routeUrl';
import { ItemRouteWithAttemptPipe, ContentTypeFromItemPipe } from 'src/app/shared/pipes/itemRoute';
import { PropagationEditMenuComponent } from '../propagation-edit-menu/propagation-edit-menu.component';
import { AddItemComponent } from '../add-item/add-item.component';
import { RouterLink } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from '../../../shared-components/components/switch/switch.component';

@Component({
  selector: 'alg-item-children-edit-list',
  templateUrl: './item-children-edit-list.component.html',
  styleUrls: [ './item-children-edit-list.component.scss' ],
  standalone: true,
  imports: [
    SwitchComponent,
    FormsModule,
    NgIf,
    TableModule,
    SharedModule,
    InputNumberModule,
    NgClass,
    RouterLink,
    AddItemComponent,
    OverlayPanelModule,
    PropagationEditMenuComponent,
    ItemRouteWithAttemptPipe,
    ContentTypeFromItemPipe,
    RouteUrlPipe,
  ],
})
export class ItemChildrenEditListComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() type: ItemTypeCategory = 'activity';
  @Input() data: PossiblyInvisibleChildData[] = [];
  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

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
}
