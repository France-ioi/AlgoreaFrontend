import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';

export interface ProgressSectionValue<T> {
  label: string,
  comment: string,
  value: T,
  disabled?: boolean,
}

@Component({
  selector: 'alg-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: [ './progress-section.component.scss' ]
})
export class ProgressSectionComponent<T> implements OnChanges {

  @Input() title = '';
  @Input() description = '';
  @Input() icon = '';

  @Input() defaultValue?: T;

  @Input() values: ProgressSectionValue<T>[] = [];

  @Input() collapsed = true;
  @Input() disabled?: boolean;

  @Output() change = new EventEmitter<T>();

  selected = 0;

  constructor() { }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.defaultValue) {
      this.selected = Math.min(0, this.values.findIndex(item => item.value === this.defaultValue));
    }
  }

  onCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  onSetActive(index: number): void {
    if (index < 0 || index >= this.values.length) throw Error('invalid selected index');
    this.selected = index;
    this.change.emit(this.values[this.selected].value);
  }

}
