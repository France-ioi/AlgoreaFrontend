import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "app-time-picker",
  templateUrl: "./time-picker.component.html",
  styleUrls: ["./time-picker.component.scss"],
})
export class TimePickerComponent implements OnInit {
  @Input() time = 30;
  @Input() status;

  _prev;

  constructor() {}

  ngOnInit() {}

  timeChange(e) {
    this._prev = this.time;
  }

  timeChanged(e) {
    if (this.time > 999) {
      this.time = this._prev;
    }
  }
}
