import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ContentChild,
  ViewChild,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table, TableService } from 'primeng/table';
import { SortEvent } from 'primeng/api/sortevent';
import { SortMeta } from 'primeng/api/sortmeta';

export function tableFactory(wrapper: GridComponent) {
  return wrapper.table;
}

export interface GridColumn {
  field: string,
  header: string
}

export interface GridColumnGroup {
  columns: GridColumn[],
  name?: string
}

@Component({
  selector: 'alg-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  providers: [
    DomHandler,
    TableService, // from old imports
    {
      provide: Table, // providing table class
      useFactory: tableFactory, // using new function
      deps: [GridComponent], // new function depends on your wrapper
    },
  ],
})
export class GridComponent implements OnInit, OnChanges {

  @Input() selection: any[]

  constructor() {}
  @ViewChild('table', { static: true }) table: Table;

  @Input() data: any[];
  @Input() selectedColumns: GridColumn[];
  @Input() columns: GridColumn[];
  @Input() groupInfo: GridColumnGroup[];

  @Input() sortMode = 'multiple';
  @Input() multiSortMeta: SortMeta[] = [];
  @Input() customSort = true;

  @Input() scrollWhenExpanded = false;
  @Input() scrollable = false;

  @Input() selectionMode: string; // primeng does not defined null as acceptable value while it is the default
  @Input() responsive = false;
  @Input() dataKey: string;
  @Input() frozenWidth: string; // primeng does not defined null as acceptable value while it is the default
  @Input() showGear = true;

  @Output() expandWholeWidth = new EventEmitter<boolean>();
  @Output() sort = new EventEmitter();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() headerCheckboxToggle = new EventEmitter();

  @ContentChild('colgroupTemplate') colgroupTemplate: TemplateRef<any>;
  @ContentChild('headerTemplate') headerTemplate: TemplateRef<any>;
  @ContentChild('bodyTemplate') bodyTemplate: TemplateRef<any>;
  @ContentChild('footerTemplate') footerTemplate: TemplateRef<any>;
  @ContentChild('summaryTemplate') summaryTemplate: TemplateRef<any>;
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate: TemplateRef<any>;
  @ContentChild('frozenHeaderTemplate') frozenHeaderTemplate: TemplateRef<any>;
  @ContentChild('frozenBodyTemplate') frozenBodyTemplate: TemplateRef<any>;

  showColumnSelection = false;

  selected: {[k: string]: any} = {};
  toShow = 0;
  expand = false;

  onSelectionChange(selection: any[]) {
    this.selection = selection;
    this.selectionChange.emit(this.selection);
  }

  onRowSelect() {
    this.selectionChange.emit(this.selection);
  }

  onRowUnselect() {
    this.selectionChange.emit(this.selection);
  }

  detectSelected() {
    for (const col of this.columns) {
      this.selected[col.field] = false;
    }

    for (const col of this.selectedColumns) {
      this.selected[col.field] = true;
    }

    this.toShow = this.columns.length - this.selectedColumns.length;
  }

  ngOnInit() {}

  ngOnChanges(_changes: SimpleChanges) {
    if (this.showGear) {
      this.detectSelected();
    }
  }

  showColumns() {
    this.showColumnSelection = !this.showColumnSelection;
  }

  showAll() {
    this.selectedColumns = this.columns;
    this.toShow = 0;
    this.expand = !this.expand;

    if (!this.expand) {
      const newSel: GridColumn[] = [];
      for (const col of this.columns) {
        if (this.selected[col.field] === true) {
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

  handleColumnChanges(item: GridColumn) {
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

  sortFunction(event: SortEvent) {
    this.sort.emit(event);
  }

  onHeaderCheckbox() {
    this.selectionChange.emit(this.selection);
  }

}
