import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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

  @Output() leave = new EventEmitter<void>();

  @Input() group?: Group;

  leaveGroup(): void {
    if (!this.group) {
      throw new Error('Unexpected: missed group');
    }

    this.groupLeaveService.leave(this.group.id).subscribe({
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
