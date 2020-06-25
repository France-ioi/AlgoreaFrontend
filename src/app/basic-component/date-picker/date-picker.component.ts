import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
})
export class DatePickerComponent implements OnInit {
  @Input() date;
  @Input() dateTimeShow = false;
  @Input() placeholder = 'XXXX/XX/XX';

  constructor() {}

  ngOnInit() {}
}
