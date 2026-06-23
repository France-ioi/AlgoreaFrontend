import { Component, DestroyRef, forwardRef, Injector, input, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormControlName,
  FormGroupDirective,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  NgModel,
  ValidationErrors
} from '@angular/forms';
import { FormErrorComponent } from '../form-error/form-error.component';
import { convertDateToString, convertStringToDate } from 'src/app/utils/input-date';
import { MaskDirective } from '../mask/mask.directive';

@Component({
  selector: 'alg-input-date',
  templateUrl: './input-date.component.html',
  styleUrl: './input-date.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputDateComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InputDateComponent),
      multi: true,
    },
  ],
  imports: [
    FormsModule,
    FormErrorComponent,
    MaskDirective,
  ]
})
export class InputDateComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  minDate = input<Date>();

  displayValue = '';
  control?: FormControl<Date | null>;
  mask = signal('99/99/9999 99:99');

  ngOnInit(): void {
    const injectedControl = this.injector.get(NgControl, null);
    if (injectedControl instanceof FormControlName) {
      this.control = this.injector.get(FormGroupDirective).getControl(injectedControl);
    } else if (injectedControl instanceof NgModel) {
      this.control = injectedControl.control;

      injectedControl.control.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(value => {
        if (injectedControl.model !== value || injectedControl.viewModel !== value) {
          injectedControl.viewToModelUpdate(value);
        }
      });
    } else {
      this.control = new FormControl();
    }
  }

  ngOnDestroy(): void {
    setTimeout(() => {
      this.control?.clearValidators();
      this.control?.updateValueAndValidity();
    });
  }

  writeValue(value: Date | null): void {
    this.displayValue = value ? convertDateToString(value) : '';
  }

  private onChange: (value: Date | null) => void = () => {};

  validate(control: AbstractControl<Date>): ValidationErrors | null {
    if (control.value !== null && isNaN(+control.value)) {
      return { inputDateInvalid: true };
    }
    const minDate = this.minDate();
    if (control.value !== null && minDate && control.value < minDate) {
      return { inputDateMinInvalid: { minDate } };
    }
    return null;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: Date | null) => void): void {
  }

  onInputChange(input: string): void {
    if (input.length === this.mask().length) {
      this.onChange(convertStringToDate(input));
    }
  }

  onBlur(): void {
    if (this.displayValue.trim() === '') {
      this.onChange(null);
    }
  }
}
