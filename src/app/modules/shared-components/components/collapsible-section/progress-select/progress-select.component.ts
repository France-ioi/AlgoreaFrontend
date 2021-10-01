import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnInit, ContentChild, TemplateRef } from '@angular/core';

export interface ProgressSelectValue<T> {
  label: string,
  comment: string,
  value: T,
  disabled?: boolean,
}

/**
 * This component is to be used in a `collapsible-section` component
 * ```
 * <alg-collapsible-section ... >
 *      <ng-template #content let-collapsed>
 *        <alg-progress-select
 *          [collapsed]="collapsed"
 *          ...
 *        ></alg-progress-select>
 *      </ng-template>
 *    </alg-collapsible-section>
 * ```
 */
@Component({
  selector: 'alg-progress-select',
  templateUrl: './progress-select.component.html',
  styleUrls: [ './progress-select.component.scss' ]
})
export class ProgressSelectComponent<T> implements OnChanges, OnInit {

  @Input() collapsed = false;

  @Input() values: ProgressSelectValue<T>[] = [];
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
