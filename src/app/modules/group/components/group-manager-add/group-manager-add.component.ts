import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupData } from '../../services/group-datasource.service';
import { switchMap } from 'rxjs/operators';
import { Manager } from '../../http-services/get-group-managers.service';
import { GetUserByLoginService } from '../../../../core/http-services/get-user-by-login.service';
import { GroupCreateManagerService } from '../../http-services/group-create-manager.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { errorIsHTTPForbidden, errorIsHTTPNotFound } from '../../../../shared/helpers/errors';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SectionParagraphComponent } from '../../../shared-components/components/section-paragrah/section-paragraph.component';

@Component({
  selector: 'alg-group-manager-add',
  templateUrl: './group-manager-add.component.html',
  styleUrls: [ './group-manager-add.component.scss' ],
  standalone: true,
  imports: [ SectionParagraphComponent, FormsModule, ButtonModule ]
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
