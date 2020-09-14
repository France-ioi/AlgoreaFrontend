import { Component, Input, OnInit } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-invite-users',
  templateUrl: './group-invite-users.component.html',
  styleUrls: ['./group-invite-users.component.scss']
})
export class GroupInviteUsersComponent implements OnInit {

  @Input() group: Group

  showMsg = false;

  constructor() { }

  ngOnInit(): void {
  }

  onInvite(_e: any) {
    this.showMsg = !this.showMsg;
  }

}
