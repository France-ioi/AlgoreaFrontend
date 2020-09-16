import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Group } from '../../http-services/get-group-by-id.service';

interface Message
{
  type: 'success' | 'info' | 'error',
  summary?:string,
  detail:string
}

@Component({
  selector: 'alg-group-invite-users',
  templateUrl: './group-invite-users.component.html',
  styleUrls: ['./group-invite-users.component.scss']
})
export class GroupInviteUsersComponent implements OnInit {

  @Input() group: Group
  @Output() refreshRequired = new EventEmitter<void>();


  logins:string[];

  processing = false;

  messages : Message[] = [];

  canClick:boolean;

  constructor() { }

  ngOnInit(): void {}

  sendInvites(_logins:string[])
  {
    //TODO
  }

  /* events */

  changeText(text:string)
  {
    this.canClick = true;

    if (text.length == 0)
    {
      this.canClick = false;
      return;
    }

    this.logins = text.split(',');

    if (this.logins.length >= 100)
    {
      this.canClick = false;
      this.messages = [{type:'error', detail:'You cannot invite more than 100 users at once'}];
      return;
    }

    this.messages = [];
  }

  invite() {
    this.processing = true;

    this.messages = [];

    this.sendInvites(this.logins);

  }
}
