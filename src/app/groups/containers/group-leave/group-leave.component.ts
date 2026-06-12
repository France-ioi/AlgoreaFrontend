import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output } from '@angular/core';
import { GroupLeaveService } from 'src/app/data-access/group-leave.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { Group } from '../../models/group';

import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-group-leave',
  templateUrl: './group-leave.component.html',
  styleUrls: [ './group-leave.component.scss' ],
  imports: [ ButtonComponent ]
})
export class GroupLeaveComponent {
  private groupLeaveService = inject(GroupLeaveService);
  private actionFeedbackService = inject(ActionFeedbackService);

  leave = output<void>();

  group = input.required<Group>();

  leaveGroup(): void {
    this.groupLeaveService.leave(this.group().id).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`You've left group`);
        this.leave.emit();
      },
      error: err => {
        this.actionFeedbackService.unexpectedError();
        if (!(err instanceof HttpErrorResponse)) throw err;
      },
    });
  }
}
