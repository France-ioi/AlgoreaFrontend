import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupData } from '../../services/group-datasource.service';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { Manager } from '../../http-services/get-group-managers.service';
import { GetUserByLoginService } from '../../../../core/http-services/get-user-by-login.service';
import { GroupCreateManagerService } from '../../http-services/group-create-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';

@Component({
  selector: 'alg-group-manager-add',
  templateUrl: './group-manager-add.component.html',
  styleUrls: [ './group-manager-add.component.scss' ]
})
export class GroupManagerAddComponent {

  @Output() added = new EventEmitter<void>();

  @Input() groupData?: GroupData;
  @Input() managers?: Manager[];

  state: 'ready' | 'error' | 'loading' = 'ready';
  login = '';

  constructor(
    private getUserByLoginService: GetUserByLoginService,
    private groupCreateManagerService: GroupCreateManagerService,
    private actionFeedbackService: ActionFeedbackService,
  ) {}

  onClick(): void {
    if (!this.managers) {
      throw new Error('Unexpected: Missed managers');
    }

    if (this.managers.some(manager => manager.login === this.login)) {
      this.actionFeedbackService.error($localize`This user is already a manager of this group.`);
      return;
    }

    if (!this.groupData) {
      throw new Error('Unexpected: missed group data');
    }

    const groupId = this.groupData.group.id;

    this.state = 'loading';
    this.getUserByLoginService.get(this.login).pipe(
      catchError(() => {
        this.state = 'error';
        this.actionFeedbackService.error($localize`The login you entered does not exist or is not visible to you.`);
        return EMPTY;
      }),
      switchMap(user => this.groupCreateManagerService.create(groupId, user.groupId)),
    ).subscribe({
      next: () => {
        this.state = 'ready';
        this.actionFeedbackService.success($localize`Manager added!`);
        this.login = '';
        this.added.emit();
      },
      error: () => {
        this.state = 'error';
        this.actionFeedbackService.error($localize`Unable to add this manager.`);
      },
    });
  }
}
