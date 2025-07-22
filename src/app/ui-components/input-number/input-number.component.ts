import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { isString } from 'src/app/utils/type-checkers';

@Component({
  selector: 'alg-input-number',
  templateUrl: './input-number.component.html',
  styleUrls: [ './input-number.component.scss' ],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputNumberComponent),
      multi: true,
    },
  ],
  imports: [
    FormsModule,
    NgxMaskDirective,
  ],
})
export class InputNumberComponent implements ControlValueAccessor {
  inputStyleClass = input('');
  suffix = input<string>();
  min = input<number>();
  max = input<number>();
  value = signal<number | null>(null);

  constructor() {
  }

  writeValue(value: number | null): void {
    this.value.set(value);
  }

  private onChange: (value: number | null) => void = () => {};

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: number | null) => void): void {
  }

  onInputChange(value: string | number): void {
    if (isString(value) && value.trim() === '') {
      this.onChange(null);
    } else {
      const numberValue = Number(value);
      const minValue = this.min();
      const maxValue = this.max();
      const validatedValue = (minValue !== undefined && numberValue < minValue ? minValue : undefined)
        || (maxValue !== undefined && numberValue > maxValue ? maxValue : undefined);
      if (validatedValue !== undefined) {
        // For to keep primeng behaviour, otherwise without setTimeout it won't update input correctly
        setTimeout(() => {
          this.value.set(validatedValue);
        });
      } else {
        this.onChange(numberValue);
      }
    }
  }

  onBlur(): void {}
}
