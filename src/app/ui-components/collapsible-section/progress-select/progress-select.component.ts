import {
  Component, computed, contentChild, forwardRef, input, output, signal, TemplateRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ProgressLevelComponent } from '../../progress-level/progress-level.component';
import { NgTemplateOutlet } from '@angular/common';
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
  styleUrl: './progress-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProgressSelectComponent),
      multi: true,
    }
  ],
  imports: [ ProgressLevelComponent, NgTemplateOutlet, TooltipDirective ]
})
export class ProgressSelectComponent<T> implements ControlValueAccessor {

  collapsed = input(false);
  values = input.required<ProgressSelectValue<T>[]>();
  theme = input<'success' | 'warning' | 'danger'>('success');

  protected readonly value = signal<T | undefined>(undefined);

  protected readonly selected = computed(() =>
    Math.max(0, this.values().findIndex(item => item.value === this.value())),
  );

  descriptionTemplate = contentChild<TemplateRef<unknown>>('description');

  valueChange = output<T>();

  private onChange: (value: T) => void = () => {};

  writeValue(value: T): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: T) => void): void {
  }

  onSet(value: T): void {
    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
