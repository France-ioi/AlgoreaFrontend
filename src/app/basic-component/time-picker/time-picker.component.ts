import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Duration, MINUTES } from '../../utils/duration';

@Component({
  selector: 'alg-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnChanges {
  @Input() initialValue : Duration;

  @Output() submit = new EventEmitter<Duration>();

  currentValue = 0;

  MINUTES = MINUTES; // export to template

  constructor() {}

  ngOnChanges(_change) {
    this.currentValue = this.initialValue.minutes();
  }

  currentDuration(): Duration|null {
    return Duration.fromHMS(0, this.currentValue, 0);
  }

  onClickValidateButton(_e) {
    const duration = this.currentDuration();
    if (duration != null) {
      this.submit.emit(duration);
    }
  }

  timeChange(_e) {
    // nothing for the moment
  }

  timeChanged(_e) {
    // nothing for the moment
  }
}
