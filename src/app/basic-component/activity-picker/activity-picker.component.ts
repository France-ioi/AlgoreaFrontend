import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-activity-picker',
  templateUrl: './activity-picker.component.html',
  styleUrls: ['./activity-picker.component.scss']
})
export class ActivityPickerComponent implements OnInit {

  selected = 'Select an activity';

  constructor() { }

  ngOnInit() {
  }

  selectActivity(e) {
    
  }

}
