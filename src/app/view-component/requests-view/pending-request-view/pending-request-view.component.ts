import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pending-request-view',
  templateUrl: './pending-request-view.component.html',
  styleUrls: ['./pending-request-view.component.scss']
})
export class PendingRequestViewComponent implements OnInit {

  @Input() columns;
  @Input() data;
  @Input() gridGr;

  groupSwitch = [
    {
      label: 'This group only'
    },
    {
      label: 'All subgroups'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

  onExpandWidth(e) {

  }

}
