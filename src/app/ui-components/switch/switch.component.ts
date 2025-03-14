import { Component, forwardRef, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

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
  imports: [ FormsModule ],
})
export class SwitchComponent implements ControlValueAccessor {
  checked = signal(false);

  change = output<boolean>();

  private onChange: (value: boolean) => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: boolean) => void): void {
  }

  handleChange(checked: boolean): void {
    this.checked.set(checked);
    this.change.emit(checked);
    this.onChange(checked);
  }
}
