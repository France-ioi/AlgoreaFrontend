import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'alg-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: [ './date-picker.component.scss' ]
})
export class DatePickerComponent implements OnInit {

  @Input() date = new Date();
  @Input() dateTimeShow = false;
  @Input() placeholder = 'XXXX/XX/XX';

  constructor() { }

  ngOnInit(): void {
  }

}
