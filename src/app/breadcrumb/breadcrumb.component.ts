import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @Input() items;
  @Output() itemClick = new EventEmitter<any>();

  selectedIdx;
  breadWidth;

  maxWidths = [100, 120, 140, 150, 200, 240, 0];

  constructor() { }

  ngOnInit() {
  }

  onItemClick(e, item, idx) {
    this.items.selectedID = item.ID;
    this.selectedIdx = idx;
    this.itemClick.emit(item);
    this.maxWidths = this.itemMaxWidth();
  }

  itemMaxWidth() {
    const widths = [100, 100, 140, 150, 200, 240, 0];

    widths[this.selectedIdx] = 150;

    return widths;
  }

  onResize(e) {
    this.breadWidth = e.newWidth;
    this.maxWidths = this.itemMaxWidth();
    console.log(this.maxWidths);
  }

}
