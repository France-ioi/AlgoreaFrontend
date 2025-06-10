import { Component, inject, input } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ConfirmationModalData } from 'src/app/services/confirmation-modal.service';

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
  data = input({ rejectButtonStyleClass: 'stroke', ...inject<ConfirmationModalData>(DIALOG_DATA) });
  dialogRef = inject<DialogRef<boolean>>(DialogRef<boolean>);

  constructor() {
  }
}
