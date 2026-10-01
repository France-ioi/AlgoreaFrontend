import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';

@Component({
  selector: 'alg-new-version-modal',
  templateUrl: './new-version-modal.component.html',
  styleUrl: './new-version-modal.component.scss',
  imports: [ ButtonComponent, NotificationModalComponent ],
})
export class NewVersionModalComponent {
  private readonly document = inject(DOCUMENT);

  onReload(): void {
    this.document.defaultView?.location.reload();
  }
}
