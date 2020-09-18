import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { TextareaComponent } from 'src/app/modules/shared-components/components/textarea/textarea.component';
import { CreateGroupInvitationsService } from '../../http-services/create-group-invitations.service';
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

  @ViewChild(TextareaComponent)
  private textArea: TextareaComponent;

  logins:string[];

  processing = false;

  tooManyLogins = false;

  messages : Message[] = [];

  canClick:boolean;

  constructor(
    private createGroupInvitationsService: CreateGroupInvitationsService,
    ) {}

  ngOnInit(): void {}

  sendInvites(_logins:string[])
  {
    //TODO
  }

  /* events */

  changeText(text:string)
  {
    this.canClick = true;
    this.tooManyLogins = false;

    if (text.length == 0)
    {
      this.canClick = false;
      return;
    }

    this.logins = text.split(',');

    if (this.logins.length >= 100)
    {
      this.canClick = false;
      this.tooManyLogins = true;
      return;
    }
  }

  invite() {
    // clear the messages
    this.messages = [];

    // remove empty logins and duplicates
    const logins = this.logins
      .map((login) => login.trim())
      .filter(function (login, index, self) {
        return self.indexOf(login) == index && login != '';
      });

    this.logins = [];

    if (logins.length == 0) return;

    // disable UI
    this.processing = true;

    this.createGroupInvitationsService.createInvitations(this.group.id, logins).subscribe(
      (res) => {
        // TODO display the messages

        // Clear the textarea
        if (this.textArea != undefined)
          this.textArea.setValue('');

        this.processing = false;
      },
      (err) => {
        // TODO process the error

        this.processing = false;
      }
    );
  }
}
