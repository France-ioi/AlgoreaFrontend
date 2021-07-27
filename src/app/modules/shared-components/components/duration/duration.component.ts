import { Component, EventEmitter, forwardRef, Injector, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormGroup,
  NgControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Duration, MAX_SECONDS_FORMAT_DURATION, MAX_TIME_FORMAT_DURATION } from 'src/app/shared/helpers/duration';

const MAX_MINUTES_VALUE = 59;
const MAX_SECONDS_VALUE = 59;

@Component({
  selector: 'alg-duration[ngModel], alg-duration[formControl], alg-duration[formControlName]',
  templateUrl: './duration.component.html',
  styleUrls: [ './duration.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DurationComponent),
      multi: true,
    },
  ]
})
export class DurationComponent implements OnInit, ControlValueAccessor, Validator {
  @Output() change = new EventEmitter<Duration | null>();

  @Input() name = '';
  @Input() parentForm?: FormGroup;
  @Input() format: 'time' | 'seconds' = 'time';

  control?: AbstractControl;

  get maxDuration(): number {
    switch (this.format) {
      case 'time': return MAX_TIME_FORMAT_DURATION;
      case 'seconds': return MAX_SECONDS_FORMAT_DURATION;
    }
  }

  hours = '';
  minutes = '';
  seconds = '';

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    // Inject NgControl at init to avoid circular dependency
    // https://stackoverflow.com/questions/39809084/injecting-ngcontrol-in-custom-validator-directive-causes-cyclic-dependency
    this.control = this.parentForm && this.name
      ? this.parentForm.get(this.name) ?? undefined
      : this.injector.get(NgControl, null)?.control ?? undefined;
  }

  private onChange: (duration: Duration | null) => void = () => {};

  validate(control: AbstractControl): ValidationErrors | null {
    const duration = control.value as Duration | null;
    if (!duration) return null;
    if (!duration.isValid()) return { invalidDuration: { invalidDuration: true } };
    if (duration.ms > this.maxDuration) return { max: { max: new Duration(this.maxDuration).toString() } };
    return null;
  }

  writeValue(duration: Duration | null): void {
    if (!duration) return;
    [ this.hours, this.minutes, this.seconds ] = duration.getHMS();
  }

  registerOnChange(fn: (duration: Duration | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (duration: Duration | null) => void): void {
  }

  emitValue(duration: Duration | null): void {
    this.change.emit(duration);
    this.onChange(duration);
  }

  handleChange(): void {
    if (this.hours === '' || this.minutes === '' || this.seconds === '') {
      this.emitValue(null);
      return;
    }

    if (
      this.minutes && +this.minutes > MAX_MINUTES_VALUE ||
      this.seconds && +this.seconds > MAX_SECONDS_VALUE) {
      this.setDefaultModelValues();
    }

    const duration: Duration = Duration.fromHMS(+this.hours, +this.minutes, +this.seconds);

    this.emitValue(duration);
  }

  setDefaultModelValues(): void {
    if (this.minutes && +this.minutes > MAX_MINUTES_VALUE) {
      this.minutes = String(MAX_MINUTES_VALUE);
    }

    if (this.seconds && +this.seconds > MAX_SECONDS_VALUE) {
      this.seconds = String(MAX_SECONDS_VALUE);
    }
  }

}
