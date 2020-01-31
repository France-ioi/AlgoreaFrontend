import { Component, OnInit, Input, OnChanges, SimpleChanges, ContentChild, ViewChild, Output, EventEmitter } from '@angular/core';
import { DomHandler } from 'primeng/dom';
import { Table, TableService } from 'primeng/table';

export function tableFactory(wrapper: GridComponent) {
  return wrapper.table;
}

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  providers: [
    DomHandler,
    TableService,// from old imports
    {
      provide: Table,// providing table class
      useFactory: tableFactory, // using new function
      deps: [GridComponent],// new function depends on your wrapper
    },
  ],
})
export class GridComponent implements OnInit, OnChanges {
  @ViewChild('table', {static: true}) table: Table;

  @Input() data;
  @Input() selectedColumns;
  @Input() columns;
  @Input() groupInfo;

  @Input() sortMode;
  @Input() scrollWhenExpanded = false;

  @Input() scrollable;
  @Input() scrollHeight;
  @Input() selectionMode;
  @Input() responsive;
  
  @Output() expandWholeWidth = new EventEmitter<boolean>();
  
  @ContentChild('headerTemplate', { static: false }) headerTemplate;
  @ContentChild('bodyTemplate', { static: false }) bodyTemplate;
  @ContentChild('footerTemplate', { static: false }) footerTemplate;
  @ContentChild('summaryTemplate', { static: false }) summaryTemplate;

  showColumnSelection = false;

  selected = {};
  toShow = 0;
  expand = false;

  constructor() { }

  detectSelected() {
    for (const col of this.columns) {
      this.selected[col.field] = false;
    }

    for (const col of this.selectedColumns) {
      this.selected[col.field] = true;
    }

    this.toShow = this.columns.length - this.selectedColumns.length;
  }

  ngOnInit() {
    // this.detectSelected();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.detectSelected();
  }

  showColumns(e) {
    this.showColumnSelection = !this.showColumnSelection;
  }

  showAll(e) {
    this.selectedColumns = this.columns;
    this.toShow = 0;
    this.expand = !this.expand;
    if (!this.expand) {
      const newSel = [];
      for (const col of this.columns) {
        if (this.selected[col.field] === true) {
          newSel.push(col);
        }
      }

      this.selectedColumns = newSel;

      this.toShow = this.columns.length - this.selectedColumns.length;
    }
    this.expandWholeWidth.emit(this.expand);
  }

  handleChanges(e, item) {
    this.selected[item.field] = !this.selected[item.field];
    const newSel = [];
    for (const col of this.columns) {
      if (this.selected[col.field] === true) {
        newSel.push(col);
      }
    }

    this.selectedColumns = newSel;

    this.toShow = this.columns.length - this.selectedColumns.length;

    console.log(this.selected);
  }

}
