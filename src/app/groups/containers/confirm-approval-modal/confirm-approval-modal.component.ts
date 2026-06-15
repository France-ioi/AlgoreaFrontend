import { Component, inject } from '@angular/core';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { DialogRef } from '@angular/cdk/dialog';

export type ConfirmApprovalModalResult = 'empty' | 'reinvite' | undefined;

@Component({
  selector: 'alg-confirm-approval-modal',
  templateUrl: './confirm-approval-modal.component.html',
  styleUrls: [ './confirm-approval-modal.component.scss' ],
  imports: [
    NotificationModalComponent,
    ButtonComponent,
  ]
})
export class ConfirmApprovalModalComponent {
  dialogRef = inject(DialogRef<ConfirmApprovalModalResult>);
}
