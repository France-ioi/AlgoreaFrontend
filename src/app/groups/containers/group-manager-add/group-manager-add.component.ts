import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Manager } from '../../data-access/get-group-managers.service';
import { GetUserByLoginService } from 'src/app/data-access/get-user-by-login.service';
import { GroupCreateManagerService } from '../../data-access/group-create-manager.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from 'src/app/utils/errors';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { Group } from '../../models/group';

@Component({
  selector: 'alg-group-manager-add',
  templateUrl: './group-manager-add.component.html',
  styleUrls: [ './group-manager-add.component.scss' ],
  imports: [ FormsModule, ButtonComponent ]
})
export class GroupManagerAddComponent {
  private getUserByLoginService = inject(GetUserByLoginService);
  private groupCreateManagerService = inject(GroupCreateManagerService);
  private actionFeedbackService = inject(ActionFeedbackService);

  @Output() added = new EventEmitter<void>();

  @Input({ required: true }) group!: Group;
  @Input() managers?: Manager[];

  state: 'ready' | 'error' | 'loading' = 'ready';
  login = '';

  onClick(): void {
    if (!this.managers) {
      throw new Error('Unexpected: Missed managers');
    }

    if (this.managers.some(manager => manager.login === this.login)) {
      this.actionFeedbackService.error($localize`This user is already a manager of this group.`);
      return;
    }

    const groupId = this.group.id;

    this.state = 'loading';
    this.getUserByLoginService.get(this.login).pipe(
      switchMap(user => this.groupCreateManagerService.create(groupId, user.groupId)),
    ).subscribe({
      next: () => {
        this.state = 'ready';
        this.actionFeedbackService.success($localize`Manager added!`);
        this.login = '';
        this.added.emit();
      },
      error: error => {
        this.state = 'error';

        if (errorIsHTTPNotFound(error)) {
          this.actionFeedbackService.error($localize`The login you entered does not exist or is not visible to you.`);
        } else if (errorIsHTTPForbidden(error)) {
          this.actionFeedbackService.error($localize`Unable to add this manager.`);
        } else {
          this.actionFeedbackService.unexpectedError();
          if (!(error instanceof HttpErrorResponse)) throw error;
        }
      },
    });
  }
}
