import { Component, OnChanges, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnChanges {
  @Input() value = 30;

  @Output() submit = new EventEmitter<Number>();

  initialValue: Number;

  constructor() {}

  ngOnChanges(_change) {
    this.initialValue = this.value;
  }

  onClickRightButton(_e) {
    if (this.value !== this.initialValue) {
      this.submit.emit(this.value);
    }
    // otherwise it should not be possible to trigger the button
  }

  timeChange(_e) {
  }

  timeChanged(_e) {
  }
}
