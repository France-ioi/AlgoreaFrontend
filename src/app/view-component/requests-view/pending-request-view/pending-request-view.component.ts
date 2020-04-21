import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-pending-request-view',
  templateUrl: './pending-request-view.component.html',
  styleUrls: ['./pending-request-view.component.scss']
})
export class PendingRequestViewComponent implements OnInit {

  @Input() columns;
  @Input() data;
  @Input() gridGr;

  @Output() onAccept = new EventEmitter<any>();
  @Output() onReject = new EventEmitter<any>();

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

  onClickAccept(e) {
    this.onAccept.emit(e);
  }

  onClickReject(e) {
    this.onReject.emit(e);
  }

}
