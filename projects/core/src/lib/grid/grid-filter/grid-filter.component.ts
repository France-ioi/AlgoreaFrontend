import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'lib-grid-filter',
  templateUrl: './grid-filter.component.html',
  styleUrls: ['./grid-filter.component.scss'],
})
export class GridFilterComponent implements OnInit {
  @Input() type: 'standard' | 'default' = 'standard';
  @Input() mode: 'basic' | 'list' | 'dates' | 'activity' = 'basic';
  @Input() text;
  @Input() ranges;
  @Input() dateRanges;
  @Input() list;
  @Input() icon;
  @Input() label;
  @Input() outsideClicked = false;
  @Output() onClose = new EventEmitter<any>();
  @Output() onHide = new EventEmitter<any>();

  menuOpened = false;

  status = [
    {
      label: 'locked',
    },
    {
      label: 'not started',
    },
    {
      label: 'started',
    },
  ];

  selectedStatus = 0;

  constructor() {}

  ngOnInit() {}

  closeFilter(e) {
    this.onClose.emit(e);
  }

  toggleMenu(e) {
    this.menuOpened = !this.menuOpened;
    this.onHide.emit(true);
  }

  hideMenu(e) {
    this.menuOpened = false;
    this.outsideClicked = false;
    this.onHide.emit(true);
  }

  changeStatus(e) {
    this.selectedStatus = e;
  }

  dateChanged(e, idx) {
    this.dateRanges[idx] = e;
  }

  listItemSelected(e) {
    this.label = e;
    this.list.forEach((item) => {
      if (item.value.id === e.value.id) {
        this.label = item.label;
      }
    });
  }
}
