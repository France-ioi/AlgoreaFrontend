import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';

interface Item {
  ID: string
  label: string,
  attempt?: number
  separator?: string,
} // FIXME: quick fix type, to be cleaned

@Component({
  selector: 'alg-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  @Input() items: {
    selectedID: string,
    path: Item[]
  }; // FIXME: quick fix type, to be cleaned
  @Output() itemClick = new EventEmitter<any>();

  selectedIdx: number;
  breadWidth: number;

  maxWidths = [9, 10, 12, 13, 16, 20, 0];

  constructor() {}

  ngOnInit() {}

  onItemClick(item: Item, idx: number) {
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

  onResize(e: ResizedEvent) {
    this.breadWidth = e.newWidth;
    this.maxWidths = this.itemMaxWidth();
  }
}
