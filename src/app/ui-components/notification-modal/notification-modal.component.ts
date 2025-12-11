import { Component, input, output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: [ './notification-modal.component.scss' ],
  standalone: true,
  imports: [ ButtonIconComponent ],
})
export class NotificationModalComponent {
  closeEvent = output();

  title = input<string | undefined>(undefined);
  icon = input('ph ph-warning');
  iconStyleClass = input<string>();
  showIcon = input(true);
  allowToClose = input(true);
}
