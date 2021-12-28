import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupLeaveService } from '../../../../core/http-services/group-leave.service';
import { ActionFeedbackService } from '../../../../shared/services/action-feedback.service';

@Component({
  selector: 'alg-group-leave',
  templateUrl: './group-leave.component.html',
  styleUrls: ['./group-leave.component.scss'],
})
export class GroupLeaveComponent {
  @Output() leave = new EventEmitter<void>();

  @Input() groupId?: string;
  @Input() locked = false;

  constructor(
    private groupLeaveService: GroupLeaveService,
    private actionFeedbackService: ActionFeedbackService,
  ) {
  }

  leaveGroup(): void {
    if (!this.groupId) {
      throw new Error('Unexpected: missed group id');
    }

    this.groupLeaveService.leave(this.groupId).subscribe({
      next: () => {
        this.actionFeedbackService.success($localize`You've left group`);
        this.leave.emit();
      },
      error: () => this.actionFeedbackService.unexpectedError(),
    });
  }
}
