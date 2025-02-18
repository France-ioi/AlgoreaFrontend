import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupLeaveService } from 'src/app/data-access/group-leave.service';
import { ActionFeedbackService } from 'src/app/services/action-feedback.service';
import { Group } from '../../data-access/get-group-by-id.service';
import { NgIf } from '@angular/common';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';

@Component({
  selector: 'alg-group-leave',
  templateUrl: './group-leave.component.html',
  styleUrls: [ './group-leave.component.scss' ],
  standalone: true,
  imports: [ NgIf, ButtonComponent ],
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
