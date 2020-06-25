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
} from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table, TableService } from 'primeng/table';
import { SortEvent } from 'primeng/api/sortevent';

export function tableFactory(wrapper: GridComponent) {
  return wrapper.table;
}

@Component({
  selector: 'app-grid',
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

  @Input()
  get selection() {
    return this.selectionValue;
  }

  set selection(val) {
    this.selectionValue = val;
    this.selectionChange.emit(this.selectionValue);
  }

  constructor() {}
  @ViewChild('table', { static: true }) table: Table;

  @Input() data;
  @Input() selectedColumns;
  @Input() columns;
  @Input() groupInfo;

  @Input() sortMode = 'multiple';
  @Input() multiSortMeta = [];
  @Input() customSort = true;

  @Input() scrollWhenExpanded = false;
  @Input() scrollable;

  @Input() selectionMode;
  @Input() responsive;
  @Input() dataKey;
  @Input() frozenCols;
  @Input() frozenWidth;
  @Input() showGear = true;

  @Output() expandWholeWidth = new EventEmitter<boolean>();
  @Output() sort = new EventEmitter();
  @Output() selectionChange = new EventEmitter();
  @Output() headerCheckboxToggle = new EventEmitter();

  @ContentChild('colgroupTemplate') colgroupTemplate;
  @ContentChild('headerTemplate') headerTemplate;
  @ContentChild('bodyTemplate') bodyTemplate;
  @ContentChild('footerTemplate') footerTemplate;
  @ContentChild('summaryTemplate') summaryTemplate;
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate;
  @ContentChild('frozenHeaderTemplate') frozenHeaderTemplate;
  @ContentChild('frozenBodyTemplate') frozenBodyTemplate;

  selectionValue = [];

  showColumnSelection = false;

  selected = {};
  toShow = 0;
  expand = false;

  onRowSelect(_e) {
    this.selectionChange.emit(this.selectionValue);
  }

  onRowUnselect(_e) {
    this.selectionChange.emit(this.selectionValue);
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

  showColumns(_e) {
    this.showColumnSelection = !this.showColumnSelection;
  }

  showAll(_e) {
    this.selectedColumns = this.columns;
    this.toShow = 0;
    this.expand = !this.expand;

    if (!this.expand) {
      const newSel = [];
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

  handleChanges(_e, item) {
    this.selected[item.field] = !this.selected[item.field];
    const newSel = [];
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

  onHeaderCheckbox(_event) {
    this.selectionChange.emit(this.selectionValue);
  }

}
