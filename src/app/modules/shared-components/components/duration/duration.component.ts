import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Duration } from '../../../../shared/helpers/duration';

const MAX_HOURS_VALUE = 838;
const MAX_MINUTES_VALUE = 59;
const MAX_SECONDS_VALUE = 59;

@Component({
  selector: 'alg-duration',
  templateUrl: './duration.component.html',
  styleUrls: [ './duration.component.scss' ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationComponent),
      multi: true,
    }
  ]
})
export class DurationComponent implements ControlValueAccessor {
  @Output() change = new EventEmitter<string | null>();

  @Input() name = '';
  @Input() parentForm?: FormGroup;

  hours = '';
  minutes = '';
  seconds = '';

  private onChange: (value: string | null) => void = () => {};

  writeValue(value: string): void {
    if (!value) {
      return;
    }

    const duration: Duration | null = Duration.fromString(value);

    if (!duration) {
      return;
    }

    this.hours = duration.getHours();
    this.minutes = duration.getMinutes();
    this.seconds = duration.getSeconds();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: string | null) => void): void {
  }

  handleChange(): void {
    if (this.hours && +this.hours > MAX_HOURS_VALUE ||
      this.minutes && +this.minutes > MAX_MINUTES_VALUE ||
      this.seconds && +this.seconds > MAX_SECONDS_VALUE) {
      this.setDefaultModelValues();
    }

    const duration: Duration = Duration.fromHMS(+this.hours, +this.minutes, +this.seconds);
    const value = duration.isValid() ? duration.toString() : null;

    this.change.emit(value);
    this.onChange(value);
  }

  setDefaultModelValues(): void {
    if (this.hours && +this.hours > MAX_HOURS_VALUE) {
      this.hours = String(MAX_HOURS_VALUE);
    }

    if (this.minutes && +this.minutes > MAX_MINUTES_VALUE) {
      this.minutes = String(MAX_MINUTES_VALUE);
    }

    if (this.seconds && +this.seconds > MAX_SECONDS_VALUE) {
      this.seconds = String(MAX_SECONDS_VALUE);
    }
  }

}
