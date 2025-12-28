import { Component, inject, signal } from '@angular/core';
import { ButtonComponent } from 'src/app/ui-components/button/button.component';
import { ItemRoutePipe } from 'src/app/pipes/itemRoute';
import { RouteUrlPipe } from 'src/app/pipes/routeUrl';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { UnlockedItems } from 'src/app/items/data-access/grade.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NotificationModalComponent } from 'src/app/ui-components/notification-modal/notification-modal.component';

@Component({
  selector: 'alg-unlocked-items-modal',
  templateUrl: './unlocked-items-modal.component.html',
  styleUrls: [ './unlocked-items-modal.component.scss' ],
  imports: [
    ButtonComponent,
    ItemRoutePipe,
    RouteUrlPipe,
    RouterLink,
    NgClass,
    NotificationModalComponent,
  ]
})
export class UnlockedItemsModalComponent {
  items = signal(inject<UnlockedItems>(DIALOG_DATA));
  dialogRef = inject(DialogRef);
}
