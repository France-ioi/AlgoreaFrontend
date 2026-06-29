import {
  Component, forwardRef, inject, Injector, OnDestroy, OnInit, signal, viewChild,
} from '@angular/core';

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
  styleUrl: './can-enter.component.scss',
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

  private readonly canEnterFromRef = viewChild('canEnterFromRef', { read: InputDateComponent });
  private readonly canEnterUntilRef = viewChild('canEnterUntilRef', { read: InputDateComponent });

  canEnterFrom = signal<Date | null>(null);
  canEnterUntil = signal<Date | null>(null);
  currentDate = signal(new Date());
  control = signal<FormControl<CanEnterValue | null> | undefined>(undefined);

  ngOnInit(): void {
    const injectedControl = this.injector.get(NgControl);
    if (injectedControl instanceof FormControlName) {
      this.control.set(this.injector.get(FormGroupDirective).getControl(injectedControl));
    }
  }

  ngOnDestroy(): void {
    setTimeout(() => {
      this.control()?.clearValidators();
      this.control()?.updateValueAndValidity();
    });
  }

  writeValue(value: CanEnterValue | null): void {
    if (value === null) return;
    this.canEnterFrom.set(value.canEnterFrom);
    this.canEnterUntil.set(value.canEnterUntil);
  }

  private onChange: (value: CanEnterValue | null) => void = () => {};

  validate(control: AbstractControl<CanEnterValue | null>): ValidationErrors | null {
    if (this.canEnterFromRef()?.control?.invalid || this.canEnterUntilRef()?.control?.invalid) return {
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

  onCanEnterFromChange(value: Date | null): void {
    this.canEnterFrom.set(value);
    this.emitDateChange();
  }

  onCanEnterUntilChange(value: Date | null): void {
    this.canEnterUntil.set(value);
    this.emitDateChange();
  }

  private emitDateChange(): void {
    if (this.canEnterFrom() === null) {
      this.canEnterFrom.set(new Date());
    }
    if (this.canEnterUntil() === null) {
      this.canEnterUntil.set(new Date(farFutureDateString));
    }
    this.onChange({
      canEnterFrom: this.canEnterFrom()!,
      canEnterUntil: this.canEnterUntil()!,
    });
  }
}
