import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { InputSwitchModule } from 'primeng/inputswitch';

/**
 * To use inside form, just set the formControlName
 * ```
 * <alg-switch formControlName="full_screen"></alg-switch>
 * ```
 * Otherwise you can use the 'change' output and the 'checked' input for regular uses
 * ```
 * <alg-switch [checked]="initialValue" (change)="onChange($event)"></alg-switch>
 * ```
 */
@Component({
  selector: 'alg-switch',
  templateUrl: './switch.component.html',
  styleUrls: [ './switch.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    }
  ],
  standalone: true,
  imports: [ InputSwitchModule, FormsModule ]
})
export class SwitchComponent implements ControlValueAccessor {
  @Input() checked = false;

  @Output() change = new EventEmitter<boolean>();

  private onChange: (value: boolean) => void = () => {};

  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: boolean) => void): void {
  }

  handleChange(checked: boolean): void {
    this.change.emit(checked);
    this.onChange(checked);
  }
}
