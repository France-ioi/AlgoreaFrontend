import { Component, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Duration } from 'core';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnChanges {
  @Input() initialValue : Duration;

  @Output() submit = new EventEmitter<Duration>();

  currentValue: number;

  constructor() {}

  ngOnChanges(_change) {
    this.currentValue = this.initialValue.minutes();
  }

  currentDuration(): Duration|null {
    return Duration.fromHMS(0, this.currentValue, 0);
  }

  onClickValidateButton(_e) {
    let duration = this.currentDuration();
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
