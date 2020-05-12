import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pending-invitation-view',
  templateUrl: './pending-invitation-view.component.html',
  styleUrls: ['./pending-invitation-view.component.scss']
})
export class PendingInvitationViewComponent implements OnInit {

  @Input() columns;
  @Input() data;
  @Input() gridGr;

  constructor() { }

  ngOnInit() {
  }

  onExpandWidth(e) {

  }

}
