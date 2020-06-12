import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
})
export class SelectionComponent implements OnInit {
  @Input() type: 'rounded' | 'square' = 'rounded';
  @Input() items;
  @Input() selected = 0;
  @Input() mode: 'light' | 'dark' | 'basic' = 'light';

  @Output() change = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  itemChanged(_e, index) {
    this.selected = index;
    this.change.emit(index);
  }
}
