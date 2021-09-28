import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnInit } from '@angular/core';

export interface ProgressSectionValue<T> {
  label: string,
  comment: string,
  value: T,
  disabled?: boolean,
}

/**
 * To add a description to the switch, just add an element with the `description` attribute inside.
 * For example:
 * ```html
 * <alg-progress-section>
 *   <p description> description </p>
 * </alg-progress-section>
 * ```
 */
@Component({
  selector: 'alg-progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: [ './progress-section.component.scss' ]
})
export class ProgressSectionComponent<T> implements OnChanges, OnInit {

  @Input() title = '';
  @Input() icon = '';

  @Input() defaultValue?: T;
  @Input() value?: T;

  @Input() values: ProgressSectionValue<T>[] = [];

  @Input() disabled = false;
  @Input() collapsible = true;
  @Input() collapsed = true;
  @Input() type: 'simple' | 'checksWithLock' = 'checksWithLock';

  @Output() valueChange = new EventEmitter<T>();

  selected = 0;

  constructor() { }

  ngOnInit(): void {
    if (this.defaultValue) this.value = this.defaultValue;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
  }

  onSet(val: T): void {
    this.value = val;
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
    this.valueChange.emit(this.value);
  }
}
