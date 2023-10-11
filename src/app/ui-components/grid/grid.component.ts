import { Component, Input, OnChanges, SimpleChanges, ContentChild, ViewChild, Output, EventEmitter, TemplateRef } from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table, TableService, TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api/sortevent';
import { SortMeta } from 'primeng/api/sortmeta';
import { SwitchComponent } from '../switch/switch.component';
import { SharedModule } from 'primeng/api';
import { NgClass, NgIf, NgTemplateOutlet, NgFor } from '@angular/common';

export function tableFactory(wrapper: GridComponent): Table|undefined {
  return wrapper.table;
}

export interface GridColumn {
  field: string,
  header: string,
}

export interface GridColumnGroup {
  columns: GridColumn[],
  name?: string,
}

@Component({
  selector: 'alg-grid',
  templateUrl: './grid.component.html',
  styleUrls: [ './grid.component.scss' ],
  providers: [
    DomHandler,
    TableService,
    {
      provide: Table,
      useFactory: tableFactory,
      deps: [ GridComponent ], // new function depends on your wrapper
    },
  ],
  standalone: true,
  imports: [
    TableModule,
    NgClass,
    NgIf,
    SharedModule,
    NgTemplateOutlet,
    NgFor,
    SwitchComponent,
  ],
})
export class GridComponent implements OnChanges {

  @Input() selection?: any[];

  constructor() {}
  @ViewChild('table', { static: true }) table?: Table;

  @Input() data?: any[];
  @Input() selectedColumns?: GridColumn[];
  @Input() columns: GridColumn[] = [];
  @Input() groupInfo: GridColumnGroup[] = [];

  @Input() sortMode: 'single' | 'multiple' = 'multiple';
  @Input() multiSortMeta: SortMeta[] = [];
  @Input() customSort = true;

  @Input() scrollWhenExpanded = false;
  @Input() scrollable = false;

  @Input() selectionMode?: 'single' | 'multiple';
  @Input() dataKey?: string;
  @Input() frozenWidth?: string;
  @Input() showGear = true;
  @Input() loading = false;
  @Input() tableStyle = '';

  @Output() expandWholeWidth = new EventEmitter<boolean>();
  @Output() sort = new EventEmitter<SortEvent>();
  @Output() selectionChange = new EventEmitter<any[]>();

  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;
  @ContentChild('bodyTemplate') bodyTemplate?: TemplateRef<any>;
  @ContentChild('footerTemplate') footerTemplate?: TemplateRef<any>;
  @ContentChild('summaryTemplate') summaryTemplate?: TemplateRef<any>;
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate?: TemplateRef<any>;
  @ContentChild('frozenHeaderTemplate') frozenHeaderTemplate?: TemplateRef<any>;
  @ContentChild('frozenBodyTemplate') frozenBodyTemplate?: TemplateRef<any>;
  @ContentChild('emptymessageTemplate') emptymessageTemplate?: TemplateRef<any>;

  showColumnSelection = false;

  selected: {[k: string]: boolean} = {};
  toShow = 0;
  expand = false;

  onSelectionChange(selection: any[]): void {
    this.selection = selection;
    this.selectionChange.emit(this.selection ?? []);
  }

  onRowSelect(): void {
    this.selectionChange.emit(this.selection ?? []);
  }

  onRowUnselect(): void {
    this.selectionChange.emit(this.selection ?? []);
  }

  detectSelected(): void {
    const selectedCol = this.selectedColumns ?? [];

    for (const col of this.columns) {
      this.selected[col.field] = false;
    }

    for (const col of selectedCol) {
      this.selected[col.field] = true;
    }

    this.toShow = this.columns.length - selectedCol.length;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.showGear) {
      this.detectSelected();
    }
  }

  showColumns(): void {
    this.showColumnSelection = !this.showColumnSelection;
  }

  showAll(): void {
    this.selectedColumns = this.columns;
    this.toShow = 0;
    this.expand = !this.expand;

    if (!this.expand) {
      const newSel: GridColumn[] = [];
      for (const col of this.columns) {
        if (this.selected[col.field]) {
          newSel.push(col);
        }
        this.selected[col.field] = true;
      }

      this.selectedColumns = newSel;

      this.toShow = this.columns.length - this.selectedColumns.length;
    }

    for (const col of this.columns) {
      this.selected[col.field] = true;
    }
    this.expandWholeWidth.emit(this.expand);
  }

  handleColumnChanges(item: GridColumn): void {
    this.selected[item.field] = !this.selected[item.field];
    const newSel: GridColumn[] = [];
    for (const col of this.columns) {
      if (this.selected[col.field] === true) {
        newSel.push(col);
      }
    }

    this.selectedColumns = newSel;

    this.toShow = this.columns.length - this.selectedColumns.length;
  }

  sortFunction(event: SortEvent): void {
    this.sort.emit(event);
  }

  onHeaderCheckbox(): void {
    this.selectionChange.emit(this.selection);
  }

  public reset(): void {
    this.table?.clear();
  }

}
