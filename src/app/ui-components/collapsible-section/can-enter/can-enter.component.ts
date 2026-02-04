import { Component, forwardRef, Injector, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';

import { InputDateComponent } from 'src/app/ui-components/input-date/input-date.component';
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
  ValidationErrors,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { farFutureDateString } from 'src/app/utils/date';
import { FormErrorComponent } from 'src/app/ui-components/form-error/form-error.component';

export interface CanEnterValue {
  canEnterFrom: Date,
  canEnterUntil: Date,
}

@Component({
  selector: 'alg-can-enter',
  templateUrl: './can-enter.component.html',
  styleUrls: [ './can-enter.component.scss' ],
  imports: [
    InputDateComponent,
    FormsModule,
    DatePipe,
    FormErrorComponent
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CanEnterComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CanEnterComponent),
      multi: true,
    },
  ]
})
export class CanEnterComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private injector = inject(Injector);

  @ViewChild('canEnterFromRef') canEnterFromRef?: InputDateComponent;
  @ViewChild('canEnterUntilRef') canEnterUntilRef?: InputDateComponent;

  canEnterFrom: Date | null = null;
  canEnterUntil: Date | null = null;
  currentDate = new Date();
  control?: FormControl<CanEnterValue | null>;

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

  writeValue(value: CanEnterValue | null): void {
    if (value === null) return;
    this.canEnterFrom = value.canEnterFrom;
    this.canEnterUntil = value.canEnterUntil;
  }

  private onChange: (value: CanEnterValue | null) => void = () => {};

  validate(control: AbstractControl<CanEnterValue | null>): ValidationErrors | null {
    if (this.canEnterFromRef?.control?.invalid || this.canEnterUntilRef?.control?.invalid) return {
      canEnterUntilDateInvalid: true
    };
    return control.value !== null && control.value.canEnterUntil <= control.value.canEnterFrom
      ? { canEnterUntilMDateMinInvalid: { minDate: control.value.canEnterFrom } } : null;
  }

  registerOnChange(fn: (value: CanEnterValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: CanEnterValue | null) => void): void {
  }

  onDateChange(): void {
    if (this.canEnterFrom === null) {
      this.canEnterFrom = new Date();
    }
    if (this.canEnterUntil === null) {
      this.canEnterUntil = new Date(farFutureDateString);
    }
    this.onChange({
      canEnterFrom: this.canEnterFrom,
      canEnterUntil: this.canEnterUntil,
    });
  }
}
