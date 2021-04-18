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
  @Output() change = new EventEmitter<string>();

  hours: number | undefined;
  minutes: number | undefined;
  seconds: number | undefined;
  value: string | undefined;

  private onChange: (value: string) => void = () => {};

  writeValue(value: string): void {
    if (!value) {
      return;
    }

    const [ hours, minutes, seconds ] = value.split(':');
    this.hours = +hours;
    this.minutes = +minutes;
    this.seconds = +seconds;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: (value: string) => void): void {
  }

  handleChange(): void {
    const value = `${this.hours || 0}:${this.minutes || 0}:${this.seconds || 0}`;
    this.change.emit(value);
    this.onChange(value);
  }

}
