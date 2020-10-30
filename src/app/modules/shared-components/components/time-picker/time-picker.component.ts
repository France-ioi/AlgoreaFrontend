import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Duration, MINUTES } from 'src/app/shared/helpers/duration';

@Component({
  selector: 'alg-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: [ './time-picker.component.scss' ],
})
export class TimePickerComponent implements OnChanges {
  @Input() initialValue? : Duration;

  @Output() submit = new EventEmitter<Duration>();

  currentValue = 0;

  readonly minutes = MINUTES; // export to template

  constructor() {}

  ngOnChanges(): void {
    if (this.initialValue) this.currentValue = this.initialValue.minutes();
  }

  currentDuration(): Duration {
    return Duration.fromHMS(0, this.currentValue, 0);
  }

  onClickValidateButton(): void {
    this.submit.emit(this.currentDuration());
  }

  timeChange(): void {
    // nothing for the moment
  }

  timeChanged(): void {
    // nothing for the moment
  }
}
