import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'alg-left-menu-back-button',
  templateUrl: './left-menu-back-button.component.html',
  styleUrls: [ './left-menu-back-button.component.scss' ],
  standalone: true,
  imports: [ ButtonModule ]
})
export class LeftMenuBackButtonComponent {
  @Output() close = new EventEmitter<void>();
  @Input() icon = 'ph ph-arrow-left';
}
