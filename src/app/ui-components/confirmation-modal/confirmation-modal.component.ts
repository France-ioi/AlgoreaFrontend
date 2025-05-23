import { Component, inject, input } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ConfirmationModalData {
  message: string,
  messageIcon?: string,
  acceptButtonCaption?: string,
  acceptButtonStyleClass?: string,
  rejectButtonCaption?: string,
  rejectButtonStyleClass?: string,
}

@Component({
  selector: 'alg-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: [ './confirmation-modal.component.scss' ],
  standalone: true,
  imports: [
    ButtonIconComponent,
    ButtonComponent,
  ],
})
export class ConfirmationModalComponent {
  data = input(inject<ConfirmationModalData>(DIALOG_DATA));
  dialogRef = inject<DialogRef<boolean>>(DialogRef<boolean>);

  constructor() {
  }
}
