import { Component, computed, DestroyRef, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DEFAULT_SCORE_WEIGHT, PossiblyInvisibleChildData } from '../item-children-edit/item-children-edit.component';
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
  styleUrl: './item-children-edit-list.component.scss',
  imports: [
    SwitchComponent,
    FormsModule,
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
export class ItemChildrenEditListComponent {
  itemData = input.required<ItemData>();
  type = input<ItemTypeCategory>('activity');
  data = input.required<PossiblyInvisibleChildData[]>();

  childrenChanges = output<PossiblyInvisibleChildData[]>();

  private dialogService = inject(Dialog);
  private destroyRef = inject(DestroyRef);

  selectedRows = signal<PossiblyInvisibleChildData[]>([]);
  scoreWeightEnabled = linkedSignal(() => this.data().some(c => c.scoreWeight !== 1));
  propagationEditItemIdx = signal<number | undefined>(undefined);
  addedItemIds = computed(() => this.data().map(item => item.id).filter(isNotUndefined));

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

  addChild(child: AddedContent<ItemType>): void {
    const permissionsForCreatedItem: ItemCorePerm = {
      canView: itemViewPermMax,
      canWatch: itemWatchPermMax,
      canEdit: itemEditPermMax,
      canGrantView: itemGrantViewPermMax,
      isOwner: true,
    };
    this.childrenChanges.emit([
      ...this.data(),
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
    this.selectedRows.update(rows => {
      if (rows.includes(item)) {
        const idx = rows.indexOf(item);
        return [ ...rows.slice(0, idx), ...rows.slice(idx + 1) ];
      }
      return [ ...rows, item ];
    });
  }

  onSelectAll(): void {
    const currentData = this.data();
    this.selectedRows.update(rows => (rows.length === currentData.length ? [] : currentData));
  }

  onRemove(): void {
    const selected = this.selectedRows();
    this.childrenChanges.emit(this.data().filter(elm => !selected.includes(elm)));
    this.selectedRows.set([]);
  }

  onEnableScoreWeightChange(event: boolean): void {
    if (!event) {
      this.childrenChanges.emit(this.data().map(c => ({ ...c, scoreWeight: DEFAULT_SCORE_WEIGHT })));
    }
  }

  orderChanged(event: CdkDragDrop<PossiblyInvisibleChildData[]>): void {
    const reordered = [ ...this.data() ];
    const previousIndex = reordered.findIndex(d => d === event.item.data);
    moveItemInArray(reordered, previousIndex, event.currentIndex);
    this.childrenChanges.emit(reordered);
  }

  onScoreWeightChange(rowData: PossiblyInvisibleChildData, scoreWeight: number | null): void {
    const index = this.data().findIndex(c => c === rowData);
    if (index === -1) {
      return;
    }
    const weight = scoreWeight ?? DEFAULT_SCORE_WEIGHT;
    this.childrenChanges.emit(
      this.data().map((c, i) => (i === index ? { ...c, scoreWeight: weight } : c)),
    );
  }

  openPropagationEditMenu(rowData: PossiblyInvisibleChildData): void {
    this.propagationEditItemIdx.set(this.data().indexOf(rowData));
  }

  emitChildPermPropagations(propagations: Partial<ItemPermPropagations>, childIdx: number): void {
    this.childrenChanges.emit(
      this.data().map((c, index) => {
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
    this.propagationEditItemIdx.set(undefined);
  }

  openAdvancedPermPropagationConfigurationDialog(child: PossiblyInvisibleChildData, childIdx: number): void {
    if (!child.permissions) throw new Error('Unexpected: missed permissions');
    const item = this.itemData().item;
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
    }).closed.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      if (result) {
        this.emitChildPermPropagations(result, childIdx);
      }
    });
  }

  whenItemVisible = (_: number, item: PossiblyInvisibleChildData): boolean => item.isVisible;
  whenItemInvisible = (_: number, item: PossiblyInvisibleChildData): boolean => !item.isVisible;
}
