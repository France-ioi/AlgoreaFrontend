import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { TextareaComponent } from 'src/app/modules/shared-components/components/textarea/textarea.component';
import { MessageService } from 'primeng/api';
import { ERROR_MESSAGE } from 'src/app/shared/constants/api';
import { TOAST_LENGTH } from 'src/app/shared/constants/global';
import { CreateGroupInvitationsService, InvitationResult } from '../../http-services/create-group-invitations.service';
import { Group } from '../../http-services/get-group-by-id.service';

interface Message
{
  type: 'success' | 'info' | 'error',
  summary?: string,
  detail: string
}

@Component({
  selector: 'alg-group-invite-users',
  templateUrl: './group-invite-users.component.html',
  styleUrls: [ './group-invite-users.component.scss' ],
  providers: [ MessageService ],
})
export class GroupInviteUsersComponent {

  @Input() group?: Group
  @Output() refreshRequired = new EventEmitter<void>();

  @ViewChild(TextareaComponent) private textArea?: TextareaComponent;

  state: 'empty'|'too_many'|'loading'|'ready' = 'empty';

  messages: Message[] = [];

  constructor(
    private createGroupInvitationsService: CreateGroupInvitationsService,
    private messageService: MessageService,
    ) {}


  private processRequestError(_err: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: ERROR_MESSAGE.fail,
      life: TOAST_LENGTH,
    });
  }

  private displayResponse(response: Map<string, InvitationResult>): void {

    const sucessInvites: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.Success).map(e => e[0]);
    const alreadyInvited: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.AlreadyInvited).map(e => e[0]);
    const notFoundUsers: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.NotFound).map(e => e[0]);
    const invalidInvites: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.Error).map(e => e[0]);

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

  onTextChange(text:string): void {
    this.state = 'ready';

    const logins = text.split(',').filter(login => login.length > 0);

    if (logins.length === 0) {
      this.state = 'empty';
    } else if (logins.length >= 100) {
      this.state = 'too_many';
    }
  }

  onInviteClicked(): void {
    if (!this.textArea || !this.group) return;

    // clear the messages
    this.messages = [];

    // remove empty logins and duplicates
    const logins = this.textArea.value.split(',')
      .map(login => login.trim())
      .filter(function (login, index, self) {
        return self.indexOf(login) === index && login !== '';
      });

    // disable UI
    this.state = 'loading';

    this.createGroupInvitationsService.createInvitations(this.group.id, logins).subscribe(
      res => {
        this.displayResponse(res);

        // Clear the textarea
        if (this.textArea) this.textArea.setValue('');

        this.state = 'empty';
      },
      err => {
        this.processRequestError(err);

        this.state = 'ready';
      }
    );
  }
}
