import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-invite-users',
  templateUrl: './group-invite-users.component.html',
  styleUrls: ['./group-invite-users.component.scss']
})
export class GroupInviteUsersComponent implements OnInit {

  @Input() group: Group
  @Output() refreshRequired = new EventEmitter<void>();

  showMsg = false;

  constructor() { }

  ngOnInit(): void {}

  onInvite() {
    this.showMsg = !this.showMsg;
  }

}
