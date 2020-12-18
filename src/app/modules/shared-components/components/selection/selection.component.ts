
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'alg-selection',
  templateUrl: './selection.component.html',
  styleUrls: [ './selection.component.scss' ],
})
export class SelectionComponent {
  @Input() type: 'rounded' | 'square' = 'rounded';
  @Input() items: any;
  @Input() selected = 0;
  @Input() mode: 'light' | 'dark' | 'basic' = 'light';

  @Output() change = new EventEmitter<number>();

  itemChanged(index: number): void {
    this.selected = index;
    this.change.emit(index);
  }
}
