import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'alg-message-icon',
  templateUrl: './message-icon.component.html',
  styleUrls: [ './message-icon.component.scss' ],
  standalone: true,
  imports: [
    NgClass,
  ],
})
export class MessageIconComponent {
  @Input() icon = 'ph-duotone ph-lock-key';
  @Input() message = '';

  constructor() {
  }
}
