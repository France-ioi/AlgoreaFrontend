import { Component, Input, Output, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { TextareaComponent } from 'src/app/modules/shared-components/components/textarea/textarea.component';
import { CreateGroupInvitationsService, InvitationResult } from '../../http-services/create-group-invitations.service';
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

  private displayResponse(response: Map<string, InvitationResult>) {
    const sucessInvites: string[] = [];
    const alreadyInvited: string[] = [];
    const notFoundUsers: string[] = [];
    const invalidInvites: string[] = [];

    for (const [key, value] of response) {
      switch (value) {
        case InvitationResult.Success:
          sucessInvites.push(key);
          break;
        case InvitationResult.AlreadyInvited:
          alreadyInvited.push(key);
          break;
        case InvitationResult.Error:
          invalidInvites.push(key);
          break;
        case InvitationResult.NotFound:
          notFoundUsers.push(key);
          break;
      }
    }

    if (sucessInvites.length > 0)
      this.messages.push({
        type: 'success',
        summary: `${sucessInvites.length} user(s) invited successfully: `,
        detail: `${sucessInvites.join(', ')}`,
      });

    if (alreadyInvited.length > 0)
      this.messages.push({
        type: 'info',
        summary: `${alreadyInvited.length} user(s) have already been invited: `,
        detail: `${alreadyInvited.join(', ')}`,
      });

    if (notFoundUsers.length > 0)
      this.messages.push({
        type: 'error',
        summary: `${notFoundUsers.length} user login(s) not found: `,
        detail: `${notFoundUsers.join(', ')}`,
      });

    if (invalidInvites.length > 0)
      this.messages.push({
        type: 'error',
        summary: `${invalidInvites.length} user login(s) could not be invited: `,
        detail: `${invalidInvites.join(', ')}`,
      });
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
        this.displayResponse(res);

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
