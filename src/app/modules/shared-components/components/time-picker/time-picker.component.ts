import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Duration, MINUTES } from 'src/app/shared/helpers/duration';

@Component({
  selector: 'alg-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnChanges {
  @Input() initialValue? : Duration;

  @Output() submit = new EventEmitter<Duration>();

  currentValue = 0;

  MINUTES = MINUTES; // export to template

  constructor() {}

  ngOnChanges() {
    if (this.initialValue) this.currentValue = this.initialValue.minutes();
  }

  currentDuration(): Duration {
    return Duration.fromHMS(0, this.currentValue, 0);
  }

  onClickValidateButton() {
    this.submit.emit(this.currentDuration());
  }

  timeChange() {
    // nothing for the moment
  }

  timeChanged() {
    // nothing for the moment
  }
}
