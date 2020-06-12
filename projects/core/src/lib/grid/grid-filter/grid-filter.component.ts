import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-grid-filter',
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

  @Output() close = new EventEmitter<any>();
  @Output() hide = new EventEmitter<any>();

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
    this.close.emit(e);
  }

  toggleMenu(_e) {
    this.menuOpened = !this.menuOpened;
    this.hide.emit(true);
  }

  hideMenu(_e) {
    this.menuOpened = false;
    this.outsideClicked = false;
    this.hide.emit(true);
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
