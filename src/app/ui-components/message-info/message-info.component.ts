import { Component, Input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: [ 'message-info.component.scss' ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ NgClass, ButtonIconComponent ]
})
export class MessageInfoComponent {
  closeEvent = output<void>();
  @Input() icon = 'ph-duotone ph-lock-key';
  @Input() closable = false;
}
