import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-select',
  templateUrl: './select.component.html',
  styleUrls: [ './select.component.scss' ],
})
export class SelectComponent implements OnInit {
  @Input() items: string[] = [];
  @Input() width = 6.5;
  @Input() opened = false;
  @Input() selected?: string;

  @Output() change = new EventEmitter<string>();
  @Output() click = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {
    if (!this.selected) this.selected = this.items.length > 0 ? this.items[0] : undefined;
  }

  toogleDropdown(e: Event): void {
    this.opened = true;
    e.stopPropagation();
    this.click.emit();
  }

  hideDropdown(): void {
    this.opened = false;
  }

  selectValue(v: string): void {
    if (this.selected !== v) {
      this.selected = v;
      this.opened = false;
      this.change.emit(v);
    }
  }
}
