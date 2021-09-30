import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnInit, ContentChild, TemplateRef } from '@angular/core';

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

  @Input() collapsed = true;

  @Input() values: ProgressSectionValue<T>[] = [];
  @Input() defaultValue?: T;
  @Input() value?: T;

  @Input() type: 'simple' | 'checksWithLock' = 'checksWithLock';

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;

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
