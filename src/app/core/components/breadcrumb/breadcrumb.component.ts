/* eslint-disable */ /* FIXME disabled for now while this is the mockup code, to be removed afterwards */
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  @Input() items;
  @Output() itemClick = new EventEmitter<any>();

  selectedIdx;
  breadWidth;

  maxWidths = [9, 10, 12, 13, 16, 20, 0];

  constructor() {}

  ngOnInit() {}

  onItemClick(item, idx) {
    this.items.selectedID = item.ID;
    this.selectedIdx = idx;
    this.itemClick.emit(item);
    this.maxWidths = this.itemMaxWidth();
  }

  itemMaxWidth() {
    const widths = [9, 9, 12, 13, 16, 20, 0];

    widths[this.selectedIdx] = 13;

    return widths;
  }

  onResize(e) {
    this.breadWidth = e.newWidth;
    this.maxWidths = this.itemMaxWidth();
  }
}
