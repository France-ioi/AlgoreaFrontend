import { Component, inject, signal } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';

@Component({
  selector: 'alg-fatal-error-modal',
  templateUrl: './fatal-error-modal.component.html',
  styleUrls: [ './fatal-error-modal.component.scss' ],
  imports: [ ButtonComponent, NotificationModalComponent ]
})
export class FatalErrorModalComponent {
  error = signal(inject<Error>(DIALOG_DATA));

  onRefresh(): void {
    window.location.reload();
  }
}
