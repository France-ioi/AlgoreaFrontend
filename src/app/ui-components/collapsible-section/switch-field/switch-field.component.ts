import { Component, ContentChild, EventEmitter, forwardRef, Input, Output, TemplateRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { SwitchComponent } from '../../switch/switch.component';
import { NgIf, NgTemplateOutlet, NgClass } from '@angular/common';
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
  styleUrls: [ './switch-field.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchFieldComponent),
      multi: true,
    }
  ],
  standalone: true,
  imports: [ NgIf, NgTemplateOutlet, SwitchComponent, NgClass, FormsModule, TooltipDirective ]
})
export class SwitchFieldComponent implements ControlValueAccessor {

  @Input() value = false;
  @Input() collapsed = false;

  // If this is not empty, the switch will be disabled, and the content of this array will appear as a tooltip
  @Input() disabledTooltip: string[] = [];

  @ContentChild('description') descriptionTemplate?: TemplateRef<any>;
  @ContentChild('label') labelTemplate?: TemplateRef<any>;
  @ContentChild('content') contentTemplate?: TemplateRef<any>;
  @ContentChild('headerContent') headerContent?: TemplateRef<any>;

  @Output() valueChange = new EventEmitter<boolean>();

  private onChange: (value: boolean) => void = () => {};

  writeValue(value: boolean): void {
    this.value = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: boolean) => void): void {
  }

  onSet(value: boolean): void {
    this.writeValue(value);
    this.valueChange.emit(value);
    this.onChange(value);
  }
}
