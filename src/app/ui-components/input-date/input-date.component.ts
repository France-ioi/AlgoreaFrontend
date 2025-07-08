import { Component, forwardRef, Injector, Input, OnDestroy, OnInit, signal } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'alg-input-date',
  templateUrl: './input-date.component.html',
  styleUrls: [ './input-date.component.scss' ],
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
  standalone: true,
  imports: [
    FormsModule,
    FormErrorComponent,
    NgxMaskDirective,
  ],
})
export class InputDateComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() minDate?: Date;

  input = '';
  control?: FormControl<Date | null>;
  subscription?: Subscription;
  mask = signal('99/99/9999 99:99');

  constructor(private injector: Injector) {
  }

  ngOnInit(): void {
    const injectedControl = this.injector.get(NgControl);
    if (injectedControl instanceof FormControlName) {
      this.control = this.injector.get(FormGroupDirective).getControl(injectedControl);
    } else if (injectedControl instanceof NgModel) {
      this.control = injectedControl.control;

      this.subscription = injectedControl.control.valueChanges.subscribe(value => {
        if (injectedControl.model !== value || injectedControl.viewModel !== value) {
          injectedControl.viewToModelUpdate(value);
        }
      });
    } else {
      this.control = new FormControl();
    }

    // Issue: by default ngx mask marks form as dirty
    // https://github.com/JsDaddy/ngx-mask/issues/1375#issuecomment-2243252405
    setTimeout(() => {
      this.control?.markAsPristine();
      this.control?.markAsUntouched();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    setTimeout(() => {
      this.control?.clearValidators();
      this.control?.updateValueAndValidity();
    });
  }

  writeValue(value: Date | null): void {
    // Issue due the race condition (probably because of async method in writeValue in ngx-mask)
    setTimeout(() => {
      this.input = value ? convertDateToString(value) : '';
    });
  }

  private onChange: (value: Date | null) => void = () => {};

  validate(control: AbstractControl<Date>): ValidationErrors | null {
    if (control.value !== null && isNaN(+control.value)) {
      return { inputDateInvalid: true };
    } else if (control.value !== null && this.minDate && control.value < this.minDate) {
      return { inputDateMinInvalid: { minDate: this.minDate } };
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
    if (this.input.trim() === '') {
      this.onChange(null);
    }
  }
}
