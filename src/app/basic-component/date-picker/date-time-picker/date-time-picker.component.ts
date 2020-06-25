import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss'],
})
export class DateTimePickerComponent implements OnInit {
  @Input() date;

  constructor() {}

  ngOnInit() {}
}
