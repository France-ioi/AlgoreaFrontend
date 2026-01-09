import { Component, computed, inject, signal } from '@angular/core';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'alg-group-observation-error-modal',
  templateUrl: './group-observation-error-modal.component.html',
  styleUrls: [ './group-observation-error-modal.component.scss' ],
  imports: [ NotificationModalComponent ]
})
export class GroupObservationErrorModalComponent {
  error = signal(inject<{ isForbidden: boolean }>(DIALOG_DATA));
  title = computed(() => (this.error().isForbidden ? $localize`Cannot observe this group` : $localize`Oops...`));

  dialogRef = inject(DialogRef);
}
