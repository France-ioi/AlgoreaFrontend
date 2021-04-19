import { Component, EventEmitter, forwardRef, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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

  hours = '';
  minutes = '';
  seconds = '';
  // value: string | undefined;

  private onChange: (value: string | null) => void = () => {};

  writeValue(value: string): void {
    if (!value) {
      return;
    }

    const [ hours, minutes, seconds ] = value.split(':');
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: string | null) => void): void {
  }

  handleChange(): void {
    if (this.hours && +this.hours > 838 || this.minutes && +this.minutes > 59 || this.seconds && +this.seconds > 59) {
      this.setDefaultModelValues();
      return;
    }

    const isValid = this.hours && this.minutes && this.seconds;
    const value = isValid ? `${this.hours}:${this.minutes}:${this.seconds}` : null;

    this.change.emit(value);
    this.onChange(value);
  }

  setDefaultModelValues(): void {
    if (this.hours && +this.hours > 838) {
      this.hours = String(838);
    }

    if (this.minutes && +this.minutes > 59) {
      this.minutes = String(59);
    }

    if (this.seconds && +this.seconds > 59) {
      this.seconds = String(59);
    }
  }

}
