import { Component, computed, EventEmitter, inject, Input, OnChanges, Output, signal } from '@angular/core';
import { DEFAULT_SCORE_WEIGHT, PossiblyInvisibleChildData } from 'src/app/items/models/item-children-edit';
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
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from 'src/app/ui-components/switch/switch.component';
import { EmptyContentComponent } from 'src/app/ui-components/empty-content/empty-content.component';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import {
  PropagationAdvancedConfigurationDialogComponent,
} from 'src/app/items/containers/propagation-advanced-configuration-dialog/propagation-advanced-configuration-dialog.component';
import { ItemPermPropagations } from 'src/app/items/models/item-perm-propagation';
import { InputNumberComponent } from 'src/app/ui-components/input-number/input-number.component';
import { CdkMenu, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkRow,
  CdkRowDef,
  CdkTable,
} from '@angular/cdk/table';
import { FindInArray } from 'src/app/pipes/findInArray';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';

@Component({
  selector: 'alg-item-children-edit-list',
  templateUrl: './item-children-edit-list.component.html',
  styleUrls: [ './item-children-edit-list.component.scss' ],
  imports: [
    SwitchComponent,
    FormsModule,
    NgClass,
    RouterLink,
    AddItemComponent,
    PropagationEditMenuComponent,
    ItemRoutePipe,
    ItemRouteWithExtraPipe,
    RouteUrlPipe,
    EmptyContentComponent,
    ButtonIconComponent,
    InputNumberComponent,
    CdkMenuTrigger,
    CdkMenu,
    CdkTable,
    CdkColumnDef,
    CdkHeaderCell,
    CdkHeaderCellDef,
    CdkCellDef,
    CdkCell,
    CdkRow,
    CdkRowDef,
    FindInArray,
    CdkDropList,
    CdkDrag,
  ]
})
export class ItemChildrenEditListComponent implements OnChanges {
  @Input() itemData?: ItemData;
  @Input() type: ItemTypeCategory = 'activity';
  @Input() data: PossiblyInvisibleChildData[] = [];
  @Output() childrenChanges = new EventEmitter<PossiblyInvisibleChildData[]>();

  private dialogService = inject(Dialog);

  selectedRows: PossiblyInvisibleChildData[] = [];
  scoreWeightEnabled = signal(false);
  propagationEditItemIdx?: number;
  addedItemIds: string[] = [];

  propagationEditMenuPositions = signal<ConnectedPosition[]>([
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: 10,
      offsetY: 10,
      panelClass: 'alg-top-right-triangle',
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetX: 10,
      offsetY: -42,
      panelClass: 'alg-bottom-right-triangle',
    },
  ]);

  baseColumns = computed(() =>
    [
      'reorder',
      'checkbox',
      ...(this.scoreWeightEnabled() ? [ 'editScore' ] : []),
      'type',
      'title',
      'invisible',
      'edit',
    ]
  );
  displayedFullColumns = computed(() => this.baseColumns().filter(c => c !== 'invisible'));
  displayedWithInvisibleColumns = computed(() =>
    this.baseColumns().filter(c => ![ 'type', 'title' ].includes(c))
  );

  constructor() {
  }

  ngOnChanges(): void {
    this.addedItemIds = this.data.map(item => item.id).filter(isNotUndefined);
    this.scoreWeightEnabled.set(this.data.some(c => c.scoreWeight !== 1));
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

  onSelect(item: PossiblyInvisibleChildData): void {
    if (this.selectedRows.includes(item)) {
      const idx = this.selectedRows.indexOf(item);
      this.selectedRows = [
        ...this.selectedRows.slice(0, idx),
        ...this.selectedRows.slice(idx + 1),
      ];
    } else {
      this.selectedRows = [ ...this.selectedRows, item ];
    }
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

  orderChanged(event: CdkDragDrop<PossiblyInvisibleChildData[]>): void {
    const previousIndex = this.data.findIndex(d => d === event.item.data);
    moveItemInArray(this.data, previousIndex, event.currentIndex);
    this.data = [ ...this.data ];
    this.childrenChanges.emit(this.data);
  }

  onScoreWeightChange(): void {
    this.childrenChanges.emit(this.data);
  }

  openPropagationEditMenu(rowData: PossiblyInvisibleChildData): void {
    this.propagationEditItemIdx = this.data.indexOf(rowData);
  }

  emitChildPermPropagations(propagations: Partial<ItemPermPropagations>, childIdx: number): void {
    this.childrenChanges.emit(
      this.data.map((c, index) => {
        if (index === childIdx) {
          return {
            ...c,
            ...propagations,
          };
        }
        return c;
      })
    );
  }

  onContentViewPropagationChanged(contentViewPropagation: 'none' | 'as_info' | 'as_content', childIdx: number): void {
    this.emitChildPermPropagations({ contentViewPropagation }, childIdx);
    this.propagationEditItemIdx = undefined;
  }

  openAdvancedPermPropagationConfigurationDialog(child: PossiblyInvisibleChildData, childIdx: number): void {
    if (!child.permissions) throw new Error('Unexpected: missed permissions');
    const item = this.itemData?.item;
    if (!item) throw new Error('Unexpected: missed item');
    const title = item.string.title;
    if (!title) throw new Error('Unexpected: missed title');
    const childTitle = child.isVisible ? child.title : undefined;
    if (childTitle === null) throw new Error('Unexpected: missed child title');

    this.dialogService.open<ItemPermPropagations>(PropagationAdvancedConfigurationDialogComponent, {
      disableClose: true,
      data: {
        item: {
          id: item.id,
          title,
        },
        childTitle,
        permissions: child.permissions,
        itemPropagations: {
          contentViewPropagation: child.contentViewPropagation,
          upperViewLevelsPropagation: child.upperViewLevelsPropagation,
          editPropagation: child.editPropagation,
          grantViewPropagation: child.grantViewPropagation,
          watchPropagation: child.watchPropagation,
        },
      },
    }).closed.subscribe(result => {
      if (result) {
        this.emitChildPermPropagations(result, childIdx);
      }
    });
  }

  whenItemVisible = (_: number, item: PossiblyInvisibleChildData): boolean => item.isVisible;
  whenItemInvisible = (_: number, item: PossiblyInvisibleChildData): boolean => !item.isVisible;
}
