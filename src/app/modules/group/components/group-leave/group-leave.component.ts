import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupLeaveService } from '../../../../core/http-services/group-leave.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';
import { Group } from '../../http-services/get-group-by-id.service';

@Component({
  selector: 'alg-group-leave',
  templateUrl: './group-leave.component.html',
  styleUrls: [ './group-leave.component.scss' ],
})
export class GroupLeaveComponent {
  @Output() leave = new EventEmitter<void>();

  @Input() group?: Group;

  constructor(
    private groupLeaveService: GroupLeaveService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
  }

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
