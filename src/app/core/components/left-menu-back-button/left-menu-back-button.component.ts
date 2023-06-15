import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'alg-left-menu-back-button',
  templateUrl: './left-menu-back-button.component.html',
  styleUrls: [ './left-menu-back-button.component.scss' ]
})
export class LeftMenuBackButtonComponent {
  @Output() close = new EventEmitter<void>();
  @Input() icon = 'ph ph-arrow-left';
}
