import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @Input() items;
  @Output() itemClick = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  onItemClick(e, item) {
    this.items.selectedID = item.ID;
    this.itemClick.emit(item);
  }

}
