import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-date-picker-simple',
  templateUrl: './date-picker-simple.component.html',
  styleUrls: ['./date-picker-simple.component.scss'],
})
export class DatePickerSimpleComponent implements OnInit {
  @Input() date;
  @Output() onChange = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  dateChanged(e) {
    this.onChange.emit(e);
  }
}
