import { Component, input, output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-message-info',
  templateUrl: './message-info.component.html',
  styleUrl: 'message-info.component.scss',
  imports: [ ButtonIconComponent ]
})
export class MessageInfoComponent {
  closeEvent = output<void>();
  icon = input('ph-duotone ph-lock-key');
  closable = input(false);
}
