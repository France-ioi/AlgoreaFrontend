import { Component, Input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: [ 'message-info.component.scss' ],
  imports: [ NgClass, ButtonIconComponent ]
})
export class MessageInfoComponent {
  closeEvent = output<void>();
  @Input() icon = 'ph-duotone ph-lock-key';
  @Input() closable = false;
}
