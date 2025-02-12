import { Component, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DEFAULT_SCORE_WEIGHT, PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { AddedContent } from 'src/app/ui-components/add-content/add-content.component';
import { ItemType, ItemTypeCategory } from 'src/app/items/models/item-type';
import { ItemCorePerm } from 'src/app/items/models/item-permissions';
import { itemViewPermMax } from 'src/app/items/models/item-view-permission';
import { itemWatchPermMax } from 'src/app/items/models/item-watch-permission';
import { itemEditPermMax } from 'src/app/items/models/item-edit-permission';
import { itemGrantViewPermMax } from 'src/app/items/models/item-grant-view-permission';
import { isNotUndefined } from 'src/app/utils/null-undefined-predicates';
import { ItemData } from '../../models/item-data';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { ItemRoutePipe, ItemRouteWithExtraPipe } from 'src/app/pipes/itemRoute';
import { PropagationEditMenuComponent } from '../propagation-edit-menu/propagation-edit-menu.component';
import { AddItemComponent } from '../add-item/add-item.component';
import { RouterLink } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { EmptyContentComponent } from 'src/app/ui-components/empty-content/empty-content.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

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
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    EmptyContentComponent,
    ButtonIconComponent,
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

  openPropagationEditMenu(event: MouseEvent, itemIdx: number): void {
    this.propagationEditItemIdx = itemIdx;
    this.op?.toggle(event);
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
