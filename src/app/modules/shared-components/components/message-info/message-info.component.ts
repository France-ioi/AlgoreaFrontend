import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'alg-message-info',
  templateUrl: './message-info.component.html',
  styleUrls: [ 'message-info.component.scss' ],
  standalone: true,
  imports: [ NgClass ],
})
export class MessageInfoComponent {
  @Input() icon = 'ph-duotone ph-lock-key';

  constructor() {
  }
}
