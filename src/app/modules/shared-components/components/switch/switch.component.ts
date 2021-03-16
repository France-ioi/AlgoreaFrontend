import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
  ]
})
export class SwitchComponent implements ControlValueAccessor {

  @Input() checked = false;
  @Input() mode: 'dark' | 'white' | 'circular' | 'dark-circular' = 'dark';
  @Input() type = 'square';

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
