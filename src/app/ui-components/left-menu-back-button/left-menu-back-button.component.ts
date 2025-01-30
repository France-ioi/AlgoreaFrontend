import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonIconComponent } from 'src/app/ui-components/button-icon/button-icon.component';

@Component({
  selector: 'alg-left-menu-back-button',
  templateUrl: './left-menu-back-button.component.html',
  styleUrls: [ './left-menu-back-button.component.scss' ],
  standalone: true,
  imports: [ ButtonIconComponent ]
})
export class LeftMenuBackButtonComponent {
  @Output() close = new EventEmitter<void>();
  @Input() icon = 'ph ph-arrow-left';
}
