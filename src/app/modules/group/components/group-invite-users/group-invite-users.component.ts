import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { CreateGroupInvitationsService, InvitationResult } from '../../http-services/create-group-invitations.service';
import { Group } from '../../http-services/get-group-by-id.service';
import { UntypedFormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActionFeedbackService } from 'src/app/shared/services/action-feedback.service';
import { HttpErrorResponse } from '@angular/common/http';

interface Message
{
  type: 'success' | 'info' | 'error',
  summary?: string,
  detail: string,
}

type GroupInviteState = 'empty'|'too_many'|'loading'|'ready';

@Component({
  selector: 'alg-group-invite-users',
  templateUrl: './group-invite-users.component.html',
  styleUrls: [ './group-invite-users.component.scss' ],
})
export class GroupInviteUsersComponent implements OnInit, OnDestroy {

  @Input() group?: Group;
  @Output() refreshRequired = new EventEmitter<void>();

  inviteForm = this.formBuilder.group({ logins: '' });
  state: GroupInviteState = 'empty';

  messages: Message[] = [];
  subscription?: Subscription;

  constructor(
    private createGroupInvitationsService: CreateGroupInvitationsService,
    private actionFeedbackService: ActionFeedbackService,
    private formBuilder: UntypedFormBuilder,
  ) {
  }

  ngOnInit(): void {
    this.subscription = this.inviteForm.get('logins')?.valueChanges.subscribe((change: string) => this.loginListChanged(change));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  setState(newState: GroupInviteState): void {
    if (this.state === newState) return;
    if (this.state === 'loading') this.inviteForm.enable(); // enable the form only if the previous state was disabled
    if (newState === 'loading') this.inviteForm.disable();
    this.state = newState;
  }

  loginListChanged(newValue: string): void {
    if (this.state === 'loading') return;
    this.setState('ready');

    const logins = newValue.split(',').filter(login => login.length > 0);

    if (logins.length === 0) {
      this.setState('empty');
    } else if (logins.length >= 100) {
      this.setState('too_many');
    }
  }

  private displayResponse(response: Map<string, InvitationResult>): void {

    const successInvites: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.Success).map(e => e[0]);
    const alreadyInvited: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.AlreadyInvited).map(e => e[0]);
    const notFoundUsers: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.NotFound).map(e => e[0]);
    const invalidInvites: string[] = Array.from(response.entries()).filter(e => e[1] === InvitationResult.Error).map(e => e[0]);

    if (successInvites.length > 0)
      this.messages.push({
        type: 'success',
        summary: $localize`${successInvites.length} user(s) invited successfully: `,
        detail: `${successInvites.join(', ')}`,
      });

    if (alreadyInvited.length > 0)
      this.messages.push({
        type: 'info',
        summary: $localize`${alreadyInvited.length} user(s) have already been invited: `,
        detail: `${alreadyInvited.join(', ')}`,
      });

    if (notFoundUsers.length > 0)
      this.messages.push({
        type: 'error',
        summary: $localize`${notFoundUsers.length} user login(s) not found: `,
        detail: `${notFoundUsers.join(', ')}`,
      });

    if (invalidInvites.length > 0)
      this.messages.push({
        type: 'error',
        summary: $localize`${invalidInvites.length} user login(s) could not be invited: `,
        detail: `${invalidInvites.join(', ')}`,
      });
  }

  /* events */
  onInviteClicked(): void {
    if (!this.group || this.state !== 'ready') return;

    // clear the messages
    this.messages = [];

    // remove empty logins and duplicates
    const control = this.inviteForm.get('logins');
    if (!control) return;

    const logins = (control.value as string).split(',')
      .map(login => login.trim())
      .filter(function (login, index, self) {
        return self.indexOf(login) === index && login !== '';
      });

    // disable UI
    this.setState('loading');

    this.createGroupInvitationsService.createInvitations(this.group.id, logins).subscribe({
      next: res => {
        this.displayResponse(res);

        // Clear the textarea
        control.setValue('');

        this.setState('empty');
      },
      error: err => {
        this.setState('ready');
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      }
    });
  }
}
