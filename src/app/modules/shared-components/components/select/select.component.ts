import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent<T> implements OnInit {
  @Input() items: T[] = [];
  @Input() width = 6.5;
  @Input() opened = false;

  @Output() change = new EventEmitter<T>();
  @Output() click = new EventEmitter();

  selected?: T;

  constructor() {}

  ngOnInit() {
    this.selected = this.items.length > 0 ? this.items[0] : undefined;
  }

  toogleDropdown(e: Event) {
    this.opened = true;
    e.stopPropagation();
    this.click.emit();
  }

  hideDropdown() {
    this.opened = false;
  }

  selectValue(v: T) {
    this.selected = v;
    this.opened = false;
    this.change.emit(v);
  }
}
