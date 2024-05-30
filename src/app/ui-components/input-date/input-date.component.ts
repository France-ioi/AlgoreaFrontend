import { Component, forwardRef, Injector, Input, OnDestroy, OnInit } from '@angular/core';
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
  ReactiveFormsModule,
  ValidationErrors
} from '@angular/forms';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePipe } from '@angular/common';
import { FormErrorComponent } from '../form-error/form-error.component';
import { convertDateToString, convertStringToDate } from 'src/app/utils/input-date';

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
    InputMaskModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    FormErrorComponent,
  ],
})
export class InputDateComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() minDate?: Date;

  input = '';
  control?: FormControl<Date | null>;

  constructor(private injector: Injector) {
  }

  ngOnInit(): void {
    const injectedControl = this.injector.get(NgControl);
    if (injectedControl instanceof FormControlName) {
      this.control = this.injector.get(FormGroupDirective).getControl(injectedControl);
    }
  }

  ngOnDestroy(): void {
    setTimeout(() => {
      this.control?.clearValidators();
      this.control?.updateValueAndValidity();
    });
  }

  writeValue(value: Date | null): void {
    this.input = value ? convertDateToString(value) : '';
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
    if (input.trim() === '') {
      this.onChange(null);
    }
  }

  onComplete(): void {
    this.onChange(convertStringToDate(this.input));
  }
}
