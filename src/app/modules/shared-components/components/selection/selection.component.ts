import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-selection',
  templateUrl: './selection.component.html',
  styleUrls: [ './selection.component.scss' ],
})
export class SelectionComponent implements OnInit {
  @Input() type: 'rounded' | 'square' = 'rounded';
  @Input() items: any;
  @Input() selected = 0;
  @Input() default?: number;
  @Input() mode: 'light' | 'dark' | 'basic' = 'light';

  @Output() change = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {
    if (this.default) this.selected = this.default;
  }

  itemChanged(index: number): void {
    this.selected = index;
    this.change.emit(index);
  }
}
