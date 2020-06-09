import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnInit {
  @Input() time = 30;
  @Input() status;

  prev;

  constructor() {}

  ngOnInit() {}

  timeChange(_e) {
    this.prev = this.time;
  }

  timeChanged(_e) {
    if (this.time > 999) {
      this.time = this.prev;
    }
  }
}
