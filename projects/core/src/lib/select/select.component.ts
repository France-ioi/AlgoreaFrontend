import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements OnInit {
  @Input() items;
  @Input() width = 6.5;
  @Input() opened = false;

  @Output() onChange = new EventEmitter<any>();
  @Output() onClick = new EventEmitter<any>();

  selected;

  constructor() {}

  ngOnInit() {
    this.selected = this.items[0];
  }

  toogleDropdown(e) {
    this.opened = true;
    e.stopPropagation();
    this.onClick.emit(true);
  }

  hideDropdown(_e) {
    this.opened = false;
  }

  selectValue(e) {
    this.selected = e;
    this.opened = false;
    this.onChange.emit(e);
  }
}
