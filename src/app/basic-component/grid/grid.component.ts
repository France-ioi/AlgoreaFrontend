import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit, OnChanges {

  @Input() data;
  @Input() selectedColumns;
  @Input() columns;

  @Input() sortMode;

  showColumnSelection = false;

  selected = {};
  toShow = 0;

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
  }

}
