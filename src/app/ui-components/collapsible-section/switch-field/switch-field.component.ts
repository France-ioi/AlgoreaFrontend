import { Component, contentChild, forwardRef, input, output, signal, TemplateRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { SwitchComponent } from '../../switch/switch.component';
import { NgTemplateOutlet } from '@angular/common';
import { TooltipDirective } from 'src/app/ui-components/tooltip/tooltip.directive';

/**
 * This component is to be used in a `collapsible-section` component.
 * To use inside form, just set the `formControlName`
 * ```
 * <alg-collapsible-section ... >
 *      <ng-template #content let-collapsed>
 *        <alg-switch-field
 *          [collapsed]="collapsed"
 *          ...
 *        ></alg-switch-field>
 *      </ng-template>
 *    </alg-collapsible-section>
 * ```
 */
@Component({
  selector: 'alg-switch-field',
  templateUrl: './switch-field.component.html',
  styleUrl: './switch-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchFieldComponent),
      multi: true,
    }
  ],
  imports: [ NgTemplateOutlet, SwitchComponent, FormsModule, TooltipDirective ]
})
export class SwitchFieldComponent implements ControlValueAccessor {

  collapsed = input(false);
  disabledTooltip = input<string[]>([]);

  protected readonly value = signal(false);

  descriptionTemplate = contentChild<TemplateRef<unknown>>('description');
  labelTemplate = contentChild<TemplateRef<unknown>>('label');
  contentTemplate = contentChild<TemplateRef<unknown>>('content');
  headerContent = contentChild<TemplateRef<unknown>>('headerContent');

  valueChange = output<boolean>();

  private onChange: (value: boolean) => void = () => {};

  writeValue(value: boolean): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: boolean) => void): void {
  }

  onSet(value: boolean): void {
    this.value.set(value);
    this.valueChange.emit(value);
    this.onChange(value);
  }
}
