import { Component, Input, OnChanges, SimpleChanges,
  Output, EventEmitter, OnInit, ContentChild, TemplateRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ProgressLevelComponent } from '../../progress-level/progress-level.component';
import { NgIf, NgClass, NgTemplateOutlet, NgFor } from '@angular/common';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

export interface ProgressSelectValue<T> {
  label: string,
  comment: string,
  value: T,
  disabled?: boolean,
  tooltip?: string[],
  selected?: boolean,
}

/**
 * This component is to be used in a `collapsible-section` component
 * To use inside form, just set the `formControlName`
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
  styleUrls: [ './progress-select.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProgressSelectComponent),
      multi: true,
    }
  ],
  standalone: true,
  imports: [ NgIf, ProgressLevelComponent, NgClass, NgTemplateOutlet, NgFor, TooltipDirective ]
})
export class ProgressSelectComponent<T> implements OnChanges, OnInit, ControlValueAccessor {

  @Input() collapsed = false;

  @Input() values: ProgressSelectValue<T>[] = [];
  @Input() defaultValue?: T;
  @Input() value?: T;
  @Input() theme: 'success' | 'warning' | 'danger' = 'success';

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;

  @Output() valueChange = new EventEmitter<T>();

  selected = 0;

  private onChange: (value: T) => void = () => {};

  constructor() { }

  writeValue(value: T): void {
    this.value = value;
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: T) => void): void {
  }

  ngOnInit(): void {
    if (this.defaultValue !== undefined) this.value = this.defaultValue;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.selected = Math.max(0, this.values.findIndex(item => item.value === this.value));
  }

  onSet(value: T): void {
    this.writeValue(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  trackByFn(index: number): number {
    return index;
  }
}
